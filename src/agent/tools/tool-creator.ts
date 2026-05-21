import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { execa } from 'execa'
import { logger } from '../../utils/logger.js'
import { AIProvider } from '../../ai/provider.js'

export interface ToolMetadata {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required: boolean }>
  requiresPermission: boolean
  createdAt: number
  source: 'auto' | 'manual'
  status: 'restart-ready'
  sourcePath: string
  compiledPath: string
}

export interface ToolGenerationResult {
  success: boolean
  toolName: string
  code: string
  metadata: ToolMetadata
  error?: string
  compilationOutput?: string
}

function getDefaultToolsDir(): string {
  return join(process.env.HOME || '~', '.spectre', 'tools')
}

export class ToolCreator {
  private provider?: AIProvider
  private toolsDir: string
  private sourceDir: string
  private activeDir: string

  constructor(provider?: AIProvider, toolsDir: string = getDefaultToolsDir()) {
    this.provider = provider
    this.toolsDir = toolsDir
    this.sourceDir = join(this.toolsDir, 'source')
    this.activeDir = join(this.toolsDir, 'active')
    for (const dir of [this.toolsDir, this.sourceDir, this.activeDir]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true, mode: 0o700 })
      }
    }
  }

  async createToolFromRequirement(
    requirement: string,
    source: 'auto' | 'manual' = 'auto',
  ): Promise<ToolGenerationResult> {
    try {
      const code = await this.generateToolCode(requirement)
      const metadata = this.extractMetadata(code, source)

      if (!metadata) {
        return {
          success: false,
          toolName: '',
          code,
          metadata: {} as ToolMetadata,
          error: 'Failed to extract tool metadata from generated code',
        }
      }

      const compilationResult = await this.compileTool(code, metadata.name)
      if (!compilationResult.success) {
        return {
          success: false,
          toolName: metadata.name,
          code,
          metadata,
          error: `Compilation failed: ${compilationResult.error}`,
          compilationOutput: compilationResult.output,
        }
      }

      this.saveTool(code, metadata)

      return {
        success: true,
        toolName: metadata.name,
        code,
        metadata,
      }
    } catch (error) {
      return {
        success: false,
        toolName: '',
        code: '',
        metadata: {} as ToolMetadata,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async generateToolCode(requirement: string): Promise<string> {
    if (!this.provider) {
      throw new Error('AI provider is required to generate dynamic tools')
    }

    const prompt = `You are a tool generator for Spectre, a coding agent. Generate a TypeScript tool module based on this requirement:

Requirement: ${requirement}

The tool must follow this exact interface:
- Import ToolDefinition, ToolInput, ToolResult from './types.js'
- Use a type-only import: import type { ToolDefinition, ToolInput, ToolResult } from './types.js'
- Export a single const named {toolName}Tool of type ToolDefinition
- Include name, description, parameters, requiresPermission, and execute function
- The execute function should handle errors gracefully and return ToolResult
- Use proper TypeScript types
- Use execa for command execution, fs for file operations, fast-glob for file search
- Do NOT use require() - use ES module imports only

Return ONLY the TypeScript code, no markdown fences, no explanations.

Example structure:
import type { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const myToolTool: ToolDefinition = {
  name: 'my_tool',
  description: 'Description of what this tool does',
  parameters: {
    param1: { type: 'string', description: 'Description', required: true },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    // Implementation
    return { success: true, output: 'Result' }
  },
}

Generate the tool now:`

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 4096,
    })

    return response.trim()
  }

  private extractMetadata(code: string, source: 'auto' | 'manual'): ToolMetadata | null {
    try {
      const nameMatch = code.match(/name:\s*['"]([^'"]+)['"]/)
      const descMatch = code.match(/description:\s*['"]([^'"]+)['"]/)
      const permMatch = code.match(/requiresPermission:\s*(true|false)/)
      const paramsMatch = code.match(/parameters:\s*(\{[\s\S]*?\n\s*\})/)

      if (!nameMatch || !descMatch) return null

      const parameters: Record<string, { type: string; description: string; required: boolean }> = {}
      if (paramsMatch) {
        const paramLines = paramsMatch[1].split('\n')
        let currentParam: string | null = null

        for (const line of paramLines) {
          const nameLine = line.match(/^\s+(\w+):\s*\{/)
          if (nameLine) {
            currentParam = nameLine[1]
            parameters[currentParam] = { type: 'string', description: '', required: false }
          }

          if (currentParam) {
            const typeMatch = line.match(/type:\s*['"]([^'"]+)['"]/)
            const descMatch = line.match(/description:\s*['"]([^'"]+)['"]/)
            const reqMatch = line.match(/required:\s*(true|false)/)

            if (typeMatch) parameters[currentParam].type = typeMatch[1]
            if (descMatch) parameters[currentParam].description = descMatch[1]
            if (reqMatch) parameters[currentParam].required = reqMatch[1] === 'true'
          }
        }
      }

      return {
        name: nameMatch[1],
        description: descMatch[1],
        parameters,
        requiresPermission: permMatch?.[1] === 'true',
        createdAt: Date.now(),
        source,
        status: 'restart-ready',
        sourcePath: join(this.sourceDir, `${nameMatch[1]}.ts`),
        compiledPath: join(this.activeDir, `${nameMatch[1]}.mjs`),
      }
    } catch {
      return null
    }
  }

  private async compileTool(
    code: string,
    toolName: string,
  ): Promise<{ success: boolean; error?: string; output?: string }> {
    const tempDir = join(this.toolsDir, '.tmp', `${toolName}-${Date.now()}`)
    const tempFile = join(tempDir, `${toolName}.ts`)
    const typesFile = join(tempDir, 'types.ts')

    try {
      mkdirSync(tempDir, { recursive: true, mode: 0o700 })
      writeFileSync(tempFile, code, 'utf-8')
      writeFileSync(
        typesFile,
        `export interface ToolInput { [key: string]: unknown }\nexport interface ToolResult { success: boolean; output: string; error?: string }\nexport interface ToolDefinition { name: string; description: string; parameters: Record<string, { type: string; description: string; required: boolean }>; requiresPermission: boolean; permissionPattern?: string; execute(input: ToolInput): Promise<ToolResult> }\n`,
        'utf-8',
      )

      const result = await execa('npx', [
        'tsc',
        '--target',
        'ES2022',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--strict',
        '--skipLibCheck',
        '--outDir',
        this.activeDir,
        tempFile,
      ], {
        cwd: process.cwd(),
        timeout: 10000,
      })

      const compiledTempFile = join(this.activeDir, `${toolName}.js`)
      const compiledFile = join(this.activeDir, `${toolName}.mjs`)
      if (existsSync(compiledTempFile)) {
        writeFileSync(compiledFile, readFileSync(compiledTempFile, 'utf-8'), { mode: 0o600 })
        unlinkSync(compiledTempFile)
      }

      return { success: true, output: result.stdout }
    } catch (error) {
      const execError = error as { stdout?: string; stderr?: string; message?: string }
      return {
        success: false,
        error: execError.message || 'Compilation failed',
        output: execError.stderr || execError.stdout,
      }
    } finally {
      if (existsSync(tempFile)) {
        unlinkSync(tempFile)
      }
      if (existsSync(typesFile)) {
        unlinkSync(typesFile)
      }
    }
  }

  private saveTool(code: string, metadata: ToolMetadata): void {
    const toolFile = join(this.sourceDir, `${metadata.name}.ts`)
    const metaFile = join(this.toolsDir, `${metadata.name}.meta.json`)

    writeFileSync(toolFile, code, { mode: 0o600 })
    writeFileSync(metaFile, JSON.stringify(metadata, null, 2), { mode: 0o600 })

    logger.info(`Saved dynamic tool: ${metadata.name} to ${toolFile}`)
  }

  loadDynamicTools(): ToolMetadata[] {
    if (!existsSync(this.toolsDir)) return []

    const tools: ToolMetadata[] = []
    const files = readdirSync(this.toolsDir)

    for (const file of files) {
      if (file.endsWith('.meta.json')) {
        try {
          const data = readFileSync(join(this.toolsDir, file), 'utf-8')
          const metadata = JSON.parse(data) as ToolMetadata
          const toolFile = join(this.activeDir, file.replace('.meta.json', '.mjs'))

          if (metadata.status === 'restart-ready' && existsSync(toolFile)) {
            tools.push(metadata)
          }
        } catch {
          continue
        }
      }
    }

    return tools
  }

  getToolCode(toolName: string): string | null {
    const toolFile = join(this.sourceDir, `${toolName}.ts`)
    if (existsSync(toolFile)) {
      return readFileSync(toolFile, 'utf-8')
    }
    return null
  }

  removeTool(toolName: string): boolean {
    const toolFile = join(this.sourceDir, `${toolName}.ts`)
    const compiledFile = join(this.activeDir, `${toolName}.mjs`)
    const metaFile = join(this.toolsDir, `${toolName}.meta.json`)

    let removed = false
    if (existsSync(toolFile)) {
      unlinkSync(toolFile)
      removed = true
    }
    if (existsSync(compiledFile)) {
      unlinkSync(compiledFile)
      removed = true
    }
    if (existsSync(metaFile)) {
      unlinkSync(metaFile)
      removed = true
    }

    return removed
  }

  getToolsDir(): string {
    return this.toolsDir
  }
}

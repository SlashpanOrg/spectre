import { ToolDefinition, ToolInput, ToolResult } from './types.js'
import { readFileTool } from './read-file.js'
import { writeFileTool } from './write-file.js'
import { editFileTool } from './edit-file.js'
import { listFilesTool } from './list-files.js'
import { searchFilesTool } from './search-files.js'
import { runCommandTool } from './run-command.js'
import { runTestsTool } from './run-tests.js'
import { debugCodeTool } from './debug-code.js'
import { indexRepoTool } from './index-repo.js'
import { queryCodebaseTool } from './query-codebase.js'
import { reviewPrTool } from './review-pr.js'
import { analyzeDebtTool } from './analyze-debt.js'
import { generateDocsTool } from './generate-docs.js'
import { createToolTool } from './create-tool.js'
import { ToolCreator } from './tool-creator.js'
import { logger } from '../../utils/logger.js'
import { pathToFileURL } from 'url'

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()
  private dynamicToolsLoaded = false
  private dynamicToolsDir?: string

  constructor(dynamicToolsDir?: string) {
    this.dynamicToolsDir = dynamicToolsDir
    this.registerDefaultTools()
    this.loadDynamicTools()
  }

  private registerDefaultTools(): void {
    this.register(readFileTool)
    this.register(writeFileTool)
    this.register(editFileTool)
    this.register(listFilesTool)
    this.register(searchFilesTool)
    this.register(runCommandTool)
    this.register(runTestsTool)
    this.register(debugCodeTool)
    this.register(indexRepoTool)
    this.register(queryCodebaseTool)
    this.register(reviewPrTool)
    this.register(analyzeDebtTool)
    this.register(generateDocsTool)
    this.register(createToolTool)
  }

  loadDynamicTools(): void {
    try {
      const creator = new ToolCreator(undefined, this.dynamicToolsDir)
      const dynamicTools = creator.loadDynamicTools()

      for (const metadata of dynamicTools) {
        this.register({
          name: metadata.name,
          description: metadata.description,
          parameters: metadata.parameters,
          requiresPermission: metadata.requiresPermission,
          execute: async (input) => {
            const moduleUrl = `${pathToFileURL(metadata.compiledPath).href}?t=${Date.now()}`
            const toolModule = (await import(moduleUrl)) as Record<string, ToolDefinition>
            const toolKey = Object.keys(toolModule).find((key) => key.endsWith('Tool'))
            const dynamicTool = toolKey ? toolModule[toolKey] : undefined
            if (!dynamicTool) {
              return { success: false, output: '', error: `Dynamic tool "${metadata.name}" has no exported ToolDefinition.` }
            }
            return dynamicTool.execute(input)
          },
        })
        logger.debug(`Loaded dynamic tool metadata: ${metadata.name}`)
      }

      this.dynamicToolsLoaded = true
    } catch (error) {
      logger.warn(`Failed to load dynamic tools: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getNames(): string[] {
    return Array.from(this.tools.keys())
  }

  async execute(name: string, input: ToolInput): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { success: false, output: '', error: `Unknown tool: ${name}` }
    }

    try {
      return await tool.execute(input)
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  findMatchingTool(request: string): ToolDefinition | null {
    const lowerRequest = request.toLowerCase()

    for (const tool of this.tools.values()) {
      const lowerName = tool.name.toLowerCase()
      const lowerDesc = tool.description.toLowerCase()

      if (lowerRequest.includes(lowerName) || lowerName.includes(lowerRequest)) {
        return tool
      }

      const descWords = lowerDesc.split(' ')
      for (const word of descWords) {
        if (word.length > 3 && lowerRequest.includes(word)) {
          return tool
        }
      }
    }

    return null
  }

  hasDynamicTools(): boolean {
    return this.dynamicToolsLoaded
  }

  getDynamicToolCount(): number {
    const creator = new ToolCreator(undefined, this.dynamicToolsDir)
    return creator.loadDynamicTools().length
  }
}

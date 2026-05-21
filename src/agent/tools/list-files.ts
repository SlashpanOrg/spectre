import { readdirSync, statSync } from 'fs'
import { resolve, relative, join } from 'path'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const listFilesTool: ToolDefinition = {
  name: 'list_files',
  description: 'List directory contents with optional filtering',
  parameters: {
    path: { type: 'string', description: 'Directory path to list (default: current directory)', required: false },
    recursive: { type: 'boolean', description: 'List recursively (default: false)', required: false },
    pattern: { type: 'string', description: 'Glob pattern to filter files', required: false },
    max_depth: { type: 'number', description: 'Maximum depth for recursive listing', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const dirPath = input.path ? resolve(process.cwd(), input.path as string) : process.cwd()

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true })
      const relativePath = relative(process.cwd(), dirPath) || '.'

      const lines: string[] = [`📁 ${relativePath}/`, '']

      const dirs: string[] = []
      const files: string[] = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          dirs.push(entry.name)
        } else {
          const stats = statSync(join(dirPath, entry.name))
          const size = formatSize(stats.size)
          files.push(`${entry.name.padEnd(40)} ${size}`)
        }
      }

      if (dirs.length > 0) {
        lines.push('Directories:')
        for (const dir of dirs.sort()) {
          lines.push(`  📁 ${dir}/`)
        }
        lines.push('')
      }

      if (files.length > 0) {
        lines.push(`Files (${files.length}):`)
        for (const file of files.sort()) {
          lines.push(`  📄 ${file}`)
        }
      }

      return { success: true, output: lines.join('\n') }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

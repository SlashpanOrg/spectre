import { readFileSync, existsSync, statSync } from 'fs'
import { resolve, relative } from 'path'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const readFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of a file with line numbers',
  parameters: {
    path: { type: 'string', description: 'Path to the file to read', required: true },
    start_line: { type: 'number', description: 'Starting line number (1-based)', required: false },
    end_line: { type: 'number', description: 'Ending line number (1-based)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const filePath = input.path as string
    if (!filePath) {
      return { success: false, output: '', error: 'File path is required' }
    }

    const resolvedPath = resolve(process.cwd(), filePath)

    if (!existsSync(resolvedPath)) {
      return { success: false, output: '', error: `File not found: ${filePath}` }
    }

    const stats = statSync(resolvedPath)
    if (stats.isDirectory()) {
      return { success: false, output: '', error: `Path is a directory: ${filePath}` }
    }

    const content = readFileSync(resolvedPath, 'utf-8')
    const lines = content.split('\n')

    const startLine = (input.start_line as number) || 1
    const endLine = (input.end_line as number) || lines.length

    const selectedLines = lines.slice(Math.max(0, startLine - 1), endLine)
    const numberedContent = selectedLines
      .map((line, i) => `${String(startLine + i).padStart(4)} │ ${line}`)
      .join('\n')

    const relativePath = relative(process.cwd(), resolvedPath)
    const header = `📄 ${relativePath} (${startLine}-${Math.min(endLine, lines.length)} of ${lines.length} lines)\n${'─'.repeat(60)}`

    return { success: true, output: `${header}\n${numberedContent}` }
  },
}

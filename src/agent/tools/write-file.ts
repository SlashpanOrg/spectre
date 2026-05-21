import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, relative } from 'path'
import { createTwoFilesPatch } from 'diff'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const writeFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file. Shows diff preview before writing.',
  parameters: {
    path: { type: 'string', description: 'Path to the file to write', required: true },
    content: { type: 'string', description: 'Content to write to the file', required: true },
    show_diff: { type: 'boolean', description: 'Show diff preview (default: true)', required: false },
  },
  requiresPermission: true,
  permissionPattern: 'write_file',
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const filePath = input.path as string
    const content = input.content as string

    if (!filePath) {
      return { success: false, output: '', error: 'File path is required' }
    }
    if (content === undefined) {
      return { success: false, output: '', error: 'Content is required' }
    }

    const resolvedPath = resolve(process.cwd(), filePath)
    const relativePath = relative(process.cwd(), resolvedPath)

    let diffOutput = ''
    if (existsSync(resolvedPath)) {
      const oldContent = readFileSync(resolvedPath, 'utf-8')
      const patch = createTwoFilesPatch(
        relativePath,
        relativePath,
        oldContent,
        content,
        'original',
        'modified',
      )
      diffOutput = `\n📋 Diff Preview:\n${'─'.repeat(60)}\n${patch}`
    } else {
      diffOutput = `\n📋 New file will be created at: ${relativePath}`
    }

    writeFileSync(resolvedPath, content, 'utf-8')

    const lines = content.split('\n').length
    return {
      success: true,
      output: `✅ Written ${lines} lines to ${relativePath}${diffOutput}`,
    }
  },
}

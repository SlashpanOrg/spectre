import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, relative } from 'path'
import { createTwoFilesPatch } from 'diff'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const editFileTool: ToolDefinition = {
  name: 'edit_file',
  description: 'Apply targeted edits to a file (search/replace, insert, delete)',
  parameters: {
    path: { type: 'string', description: 'Path to the file to edit', required: true },
    operation: { type: 'string', description: 'Operation: replace, insert, delete', required: true },
    search: { type: 'string', description: 'Text to search for (replace/delete)', required: false },
    replacement: { type: 'string', description: 'Replacement text (replace/insert)', required: false },
    line_number: { type: 'number', description: 'Line number for insert/delete', required: false },
  },
  requiresPermission: true,
  permissionPattern: 'write_file',
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const filePath = input.path as string
    const operation = input.operation as string

    if (!filePath) {
      return { success: false, output: '', error: 'File path is required' }
    }
    if (!operation) {
      return { success: false, output: '', error: 'Operation is required (replace, insert, delete)' }
    }

    const resolvedPath = resolve(process.cwd(), filePath)
    if (!existsSync(resolvedPath)) {
      return { success: false, output: '', error: `File not found: ${filePath}` }
    }

    const oldContent = readFileSync(resolvedPath, 'utf-8')
    const lines = oldContent.split('\n')
    let newContent = oldContent

    if (operation === 'replace') {
      const search = input.search as string
      const replacement = input.replacement as string
      if (!search) {
        return { success: false, output: '', error: 'Search text is required for replace operation' }
      }
      if (!oldContent.includes(search)) {
        return { success: false, output: '', error: `Search text not found in file: "${search.substring(0, 50)}..."` }
      }
      newContent = oldContent.replace(search, replacement || '')
    } else if (operation === 'insert') {
      const lineNumber = (input.line_number as number) || lines.length
      const text = input.replacement as string
      if (!text) {
        return { success: false, output: '', error: 'Replacement text is required for insert operation' }
      }
      const insertIndex = Math.min(lineNumber - 1, lines.length)
      lines.splice(insertIndex, 0, text)
      newContent = lines.join('\n')
    } else if (operation === 'delete') {
      const search = input.search as string
      const lineNumber = input.line_number as number
      if (search) {
        if (!oldContent.includes(search)) {
          return { success: false, output: '', error: `Search text not found: "${search.substring(0, 50)}..."` }
        }
        newContent = oldContent.replace(search, '')
      } else if (lineNumber) {
        if (lineNumber < 1 || lineNumber > lines.length) {
          return { success: false, output: '', error: `Invalid line number: ${lineNumber}` }
        }
        lines.splice(lineNumber - 1, 1)
        newContent = lines.join('\n')
      } else {
        return { success: false, output: '', error: 'Provide search text or line_number for delete operation' }
      }
    } else {
      return { success: false, output: '', error: `Unknown operation: ${operation}` }
    }

    const relativePath = relative(process.cwd(), resolvedPath)
    const patch = createTwoFilesPatch(relativePath, relativePath, oldContent, newContent, 'original', 'modified')

    writeFileSync(resolvedPath, newContent, 'utf-8')

    return {
      success: true,
      output: `✅ Applied ${operation} to ${relativePath}\n\n📋 Diff:\n${'─'.repeat(60)}\n${patch}`,
    }
  },
}

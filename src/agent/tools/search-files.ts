import { readFileSync, existsSync, statSync } from 'fs'
import { resolve, relative } from 'path'
import fg from 'fast-glob'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const searchFilesTool: ToolDefinition = {
  name: 'search_files',
  description: 'Search for text patterns across project files',
  parameters: {
    pattern: { type: 'string', description: 'Text pattern to search for', required: true },
    path: { type: 'string', description: 'Directory to search in (default: current directory)', required: false },
    file_pattern: { type: 'string', description: 'Glob pattern for files to search (e.g., "*.ts")', required: false },
    case_sensitive: { type: 'boolean', description: 'Case sensitive search (default: false)', required: false },
    max_results: { type: 'number', description: 'Maximum number of results (default: 50)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const searchPattern = input.pattern as string
    if (!searchPattern) {
      return { success: false, output: '', error: 'Search pattern is required' }
    }

    const searchDir = input.path ? resolve(process.cwd(), input.path as string) : process.cwd()
    const filePattern = (input.file_pattern as string) || '**/*'
    const caseSensitive = input.case_sensitive === true
    const maxResults = (input.max_results as number) || 50

    try {
      const files = await fg(filePattern, {
        cwd: searchDir,
        absolute: true,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      })

      const regex = new RegExp(searchPattern, caseSensitive ? 'g' : 'gi')
      const results: { file: string; line: number; content: string }[] = []

      for (const file of files) {
        if (!existsSync(file)) continue
        const stats = statSync(file)
        if (stats.size > 1024 * 1024) continue

        try {
          const content = readFileSync(file, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              results.push({
                file: relative(process.cwd(), file),
                line: i + 1,
                content: lines[i].trim(),
              })
              regex.lastIndex = 0
              if (results.length >= maxResults) break
            }
          }

          if (results.length >= maxResults) break
        } catch {
          continue
        }
      }

      if (results.length === 0) {
        return { success: true, output: `No matches found for "${searchPattern}"` }
      }

      const lines: string[] = [`🔍 Found ${results.length} match(es) for "${searchPattern}":\n${'─'.repeat(60)}`]

      for (const result of results) {
        lines.push(`${result.file}:${result.line}`)
        lines.push(`  ${result.content}`)
        lines.push('')
      }

      return { success: true, output: lines.join('\n') }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}

import { ToolDefinition, ToolInput, ToolResult } from './types.js'
import { getProvider } from '../../ai/config.js'

export const reviewPrTool: ToolDefinition = {
  name: 'review_pr',
  description: 'Review a pull request or branch changes',
  parameters: {
    base: { type: 'string', description: 'Base branch to compare against (default: main)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    try {
      const { PRReviewer } = await import('../../tools/pr-reviewer.js')
      const base = (input.base as string) || 'main'
      const provider = getProvider()

      const reviewer = new PRReviewer(provider)
      const result = await reviewer.review(base)

      let output = `📝 PR Review: ${result.branch} → ${result.baseBranch}\n${'─'.repeat(60)}\n\n`
      output += `📊 Files Changed: ${result.totalChanges}\n\n`

      if (result.comments.length > 0) {
        output += `⚠️  Review Comments (${result.comments.length}):\n`
        for (const comment of result.comments.slice(0, 10)) {
          output += `\n  • [${comment.severity}] ${comment.file}`
          if (comment.line) output += `:${comment.line}`
          output += `\n    ${comment.message}\n`
          if (comment.suggestion) output += `    Suggestion: ${comment.suggestion}\n`
        }
      }

      output += `\n📋 Summary:\n${result.summary}\n`
      output += `\n⏱️  Duration: ${result.duration}ms`

      return { success: true, output }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `PR review failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}

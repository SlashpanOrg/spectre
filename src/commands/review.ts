import { PRReviewer } from '../tools/pr-reviewer.js'
import { getProvider } from '../ai/config.js'
import { clearProviderCache } from '../ai/config.js'
import { logger } from '../utils/logger.js'

export const reviewCommand = {
  name: 'review',
  description: 'Review current branch changes against base branch',
  usage: '/review [base-branch]',
  execute: async (args?: string): Promise<string> => {
    try {
      clearProviderCache()
      const provider = getProvider()
      const baseBranch = args || 'main'

      const reviewer = new PRReviewer(provider)
      const result = await reviewer.review(baseBranch)

      if (result.totalChanges === 0) {
        return result.summary
      }

      let output = `📋 PR Review: ${result.branch} → ${result.baseBranch}\n`
      output += `Files changed: ${result.totalChanges}\n`
      output += `Duration: ${result.duration}ms\n\n`

      const critical = result.comments.filter((c) => c.severity === 'critical')
      const warnings = result.comments.filter((c) => c.severity === 'warning')
      const info = result.comments.filter((c) => c.severity === 'info')

      if (critical.length > 0) {
        output += `**Critical (${critical.length}):**\n`
        for (const c of critical) {
          output += `- ${c.file}${c.line ? `:${c.line}` : ''}: ${c.message}\n`
          if (c.suggestion) output += `  → ${c.suggestion}\n`
        }
        output += '\n'
      }

      if (warnings.length > 0) {
        output += `**Warnings (${warnings.length}):**\n`
        for (const c of warnings.slice(0, 10)) {
          output += `- ${c.file}${c.line ? `:${c.line}` : ''}: ${c.message}\n`
          if (c.suggestion) output += `  → ${c.suggestion}\n`
        }
        if (warnings.length > 10) output += `... and ${warnings.length - 10} more warnings\n`
        output += '\n'
      }

      if (info.length > 0) {
        output += `**Suggestions (${info.length}):**\n`
        for (const c of info.slice(0, 5)) {
          output += `- ${c.file}: ${c.message}\n`
        }
        if (info.length > 5) output += `... and ${info.length - 5} more suggestions\n`
        output += '\n'
      }

      output += `**Summary:** ${result.summary}`

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Review failed:', msg)
      return `Review failed: ${msg}`
    }
  },
}

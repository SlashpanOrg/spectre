import { ToolDefinition, ToolInput, ToolResult } from './types.js'
import { getProvider } from '../../ai/config.js'

export const analyzeDebtTool: ToolDefinition = {
  name: 'analyze_debt',
  description: 'Analyze technical debt in the codebase',
  parameters: {
    branch: { type: 'string', description: 'Branch to analyze (default: HEAD)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    try {
      const { TechDebtDetector } = await import('../../tools/debt-detector.js')
      const branch = (input.branch as string) || 'HEAD'
      const provider = getProvider()

      const detector = new TechDebtDetector(provider)
      const report = await detector.analyze(branch)

      let output = `🔍 Technical Debt Analysis\n${'─'.repeat(60)}\n\n`
      output += `📊 Health Score: ${report.healthScore}/100\n`
      output += `📋 Total Issues: ${report.totalItems}\n`
      output += `  Critical: ${report.breakdown.critical}\n`
      output += `  Warning: ${report.breakdown.warning}\n`
      output += `  Info: ${report.breakdown.info}\n\n`

      if (report.items.length > 0) {
        output += `⚠️  Top Issues:\n`
        for (const item of report.items.slice(0, 10)) {
          output += `\n  • [${item.severity}] ${item.file}\n`
          output += `    ${item.description}\n`
          if (item.suggestion) output += `    Suggestion: ${item.suggestion}\n`
        }
      }

      output += `\n⏱️  Duration: ${report.duration}ms`

      return { success: true, output }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Debt analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}

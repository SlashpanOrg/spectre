import { TechDebtDetector } from '../tools/debt-detector.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { logger } from '../utils/logger.js'

export const debtCommand = {
  name: 'debt',
  description: 'Analyze technical debt in the repository',
  usage: '/debt [branch]',
  execute: async (args?: string): Promise<string> => {
    try {
      clearProviderCache()
      const provider = getProvider()
      const branch = args || 'HEAD'

      const detector = new TechDebtDetector(provider)
      const report = await detector.analyze(branch)

      if (report.totalItems === 0) {
        return `Health Score: ${report.healthScore}/100\nNo technical debt detected.`
      }

      let output = `📊 Tech Debt Report\n`
      output += `Health Score: ${report.healthScore}/100\n`
      output += `Total items: ${report.totalItems}\n`
      output += `Duration: ${report.duration}ms\n\n`

      output += `**Breakdown:**\n`
      output += `- Critical: ${report.breakdown.critical}\n`
      output += `- Warnings: ${report.breakdown.warning}\n`
      output += `- Info: ${report.breakdown.info}\n\n`

      output += `**By Category:**\n`
      for (const [category, count] of Object.entries(report.categoryBreakdown)) {
        output += `- ${category}: ${count}\n`
      }
      output += '\n'

      const criticalItems = report.items.filter((i) => i.severity === 'critical')
      if (criticalItems.length > 0) {
        output += `**Critical Issues:**\n`
        for (const item of criticalItems) {
          output += `- ${item.file} (${item.category}): ${item.description}\n`
          if (item.suggestion) output += `  → ${item.suggestion}\n`
        }
        output += '\n'
      }

      const warningItems = report.items.filter((i) => i.severity === 'warning')
      if (warningItems.length > 0) {
        output += `**Warnings:**\n`
        for (const item of warningItems.slice(0, 10)) {
          output += `- ${item.file} (${item.category}): ${item.description}\n`
          if (item.suggestion) output += `  → ${item.suggestion}\n`
        }
        if (warningItems.length > 10)
          output += `... and ${warningItems.length - 10} more warnings\n`
        output += '\n'
      }

      return output.trim()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Debt analysis failed:', msg)
      return `Debt analysis failed: ${msg}`
    }
  },
}

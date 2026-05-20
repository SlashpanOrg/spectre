import { CommandHandler } from './parser.js'
import { IndexingPipeline } from '../tools/indexing-pipeline.js'
import { QueryEngine } from '../tools/query-engine.js'
import { PRReviewer } from '../tools/pr-reviewer.js'
import { TechDebtDetector } from '../tools/debt-detector.js'
import { DocGenerator, DocType } from '../tools/doc-generator.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { logger } from '../utils/logger.js'

export const indexCommand: CommandHandler = {
  name: 'index',
  description: 'Index a Git repository',
  execute: async (args?: string) => {
    try {
      clearProviderCache()
      const repoPath = args || '.'
      const pipeline = new IndexingPipeline(repoPath)

      console.log('Starting indexing...')
      const result = await pipeline.index(false, (progress) => {
        process.stdout.write(
          `\rIndexing: ${progress.current}/${progress.total} (${progress.percentage}%) - ${progress.currentCommit || ''}`,
        )
      })
      console.log()

      const stats = await pipeline.getStats()
      pipeline.close()

      let output = `Indexing complete!\n`
      output += `Commits indexed: ${result.indexedCommits}\n`
      output += `Skipped: ${result.skippedCommits}\n`
      output += `Duration: ${result.duration}ms\n`
      output += `Total points in store: ${stats.totalPoints}\n`
      output += `Indexed repos: ${stats.repos}`

      if (result.errors.length > 0) {
        output += `\n\nErrors (${result.errors.length}):\n`
        output += result.errors.slice(0, 5).join('\n')
        if (result.errors.length > 5) {
          output += `\n... and ${result.errors.length - 5} more`
        }
      }

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Indexing failed:', msg)
      return `Indexing failed: ${msg}`
    }
  },
}

export const queryCommand: CommandHandler = {
  name: 'query',
  description: 'Ask a question about your codebase',
  execute: async (args?: string) => {
    try {
      clearProviderCache()

      if (!args) {
        return 'Usage: /query "your question here"'
      }

      const engine = new QueryEngine()
      const result = await engine.query(args)
      engine.close()

      let output = `Answer (${result.duration}ms):\n\n`
      output += result.answer

      if (result.evidence.length > 0) {
        output += '\n\n**Evidence:**\n'
        for (const ev of result.evidence.slice(0, 5)) {
          output += `- [${ev.hash.substring(0, 7)}] ${ev.message} by ${ev.author} (score: ${ev.score.toFixed(2)})\n`
        }
      }

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Query failed:', msg)
      return `Query failed: ${msg}`
    }
  },
}

export const reviewCommand: CommandHandler = {
  name: 'review',
  description: 'Review current branch changes against base branch',
  execute: async (args?: string) => {
    try {
      clearProviderCache()
      const provider = getProvider()
      const baseBranch = args || 'main'

      const reviewer = new PRReviewer(provider)
      const result = await reviewer.review(baseBranch)

      if (result.totalChanges === 0) {
        return result.summary
      }

      let output = `PR Review: ${result.branch} -> ${result.baseBranch}\n`
      output += `Files changed: ${result.totalChanges}\n`
      output += `Duration: ${result.duration}ms\n\n`

      const critical = result.comments.filter((c) => c.severity === 'critical')
      const warnings = result.comments.filter((c) => c.severity === 'warning')
      const info = result.comments.filter((c) => c.severity === 'info')

      if (critical.length > 0) {
        output += `Critical (${critical.length}):\n`
        for (const c of critical) {
          output += `- ${c.file}${c.line ? `:${c.line}` : ''}: ${c.message}\n`
          if (c.suggestion) output += `  -> ${c.suggestion}\n`
        }
        output += '\n'
      }

      if (warnings.length > 0) {
        output += `Warnings (${warnings.length}):\n`
        for (const c of warnings.slice(0, 10)) {
          output += `- ${c.file}${c.line ? `:${c.line}` : ''}: ${c.message}\n`
          if (c.suggestion) output += `  -> ${c.suggestion}\n`
        }
        if (warnings.length > 10) output += `... and ${warnings.length - 10} more warnings\n`
        output += '\n'
      }

      if (info.length > 0) {
        output += `Suggestions (${info.length}):\n`
        for (const c of info.slice(0, 5)) {
          output += `- ${c.file}: ${c.message}\n`
        }
        if (info.length > 5) output += `... and ${info.length - 5} more suggestions\n`
        output += '\n'
      }

      output += `Summary: ${result.summary}`

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Review failed:', msg)
      return `Review failed: ${msg}`
    }
  },
}

export const debtCommand: CommandHandler = {
  name: 'debt',
  description: 'Analyze technical debt in the repository',
  execute: async (args?: string) => {
    try {
      clearProviderCache()
      const provider = getProvider()
      const branch = args || 'HEAD'

      const detector = new TechDebtDetector(provider)
      const report = await detector.analyze(branch)

      if (report.totalItems === 0) {
        return `Health Score: ${report.healthScore}/100\nNo technical debt detected.`
      }

      let output = `Tech Debt Report\n`
      output += `Health Score: ${report.healthScore}/100\n`
      output += `Total items: ${report.totalItems}\n`
      output += `Duration: ${report.duration}ms\n\n`

      output += `Breakdown:\n`
      output += `- Critical: ${report.breakdown.critical}\n`
      output += `- Warnings: ${report.breakdown.warning}\n`
      output += `- Info: ${report.breakdown.info}\n\n`

      output += `By Category:\n`
      for (const [category, count] of Object.entries(report.categoryBreakdown)) {
        output += `- ${category}: ${count}\n`
      }
      output += '\n'

      const criticalItems = report.items.filter((i) => i.severity === 'critical')
      if (criticalItems.length > 0) {
        output += `Critical Issues:\n`
        for (const item of criticalItems) {
          output += `- ${item.file} (${item.category}): ${item.description}\n`
          if (item.suggestion) output += `  -> ${item.suggestion}\n`
        }
        output += '\n'
      }

      const warningItems = report.items.filter((i) => i.severity === 'warning')
      if (warningItems.length > 0) {
        output += `Warnings:\n`
        for (const item of warningItems.slice(0, 10)) {
          output += `- ${item.file} (${item.category}): ${item.description}\n`
          if (item.suggestion) output += `  -> ${item.suggestion}\n`
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

export const docsCommand: CommandHandler = {
  name: 'docs',
  description: 'Generate documentation (runbook, onboarding, decision-log, architecture)',
  execute: async (args?: string) => {
    try {
      clearProviderCache()
      const provider = getProvider()

      const VALID_TYPES: DocType[] = ['runbook', 'onboarding', 'decision-log', 'architecture']

      if (!args) {
        return `Available doc types:\n${VALID_TYPES.map((t) => `- ${t}`).join('\n')}\n\nUsage: /docs <type> [--export <path>]`
      }

      const parts = args.split(' ')
      const type = parts[0] as DocType

      if (!VALID_TYPES.includes(type)) {
        return `Invalid doc type: ${type}\nAvailable: ${VALID_TYPES.join(', ')}`
      }

      const exportPath = parts.includes('--export')
        ? parts[parts.indexOf('--export') + 1]
        : undefined

      const generator = new DocGenerator('.', provider)
      const doc = await generator.generate(type)

      let output = `${doc.title}\n`
      output += `Type: ${doc.type}\n`
      output += `Words: ${doc.wordCount}\n`
      output += `Generated: ${doc.generatedAt}\n`
      output += `Duration: ${doc.duration}ms\n\n`
      output += '---\n\n'
      output += doc.content

      if (exportPath) {
        await generator.export(doc, exportPath)
        output += `\n\nExported to: ${exportPath}`
      }

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Doc generation failed:', msg)
      return `Doc generation failed: ${msg}`
    }
  },
}

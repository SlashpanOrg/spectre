import { IndexingPipeline } from '../tools/indexing-pipeline.js'
import { QueryEngine } from '../tools/query-engine.js'
import { PRReviewer } from '../tools/pr-reviewer.js'
import { TechDebtDetector } from '../tools/debt-detector.js'
import { DocGenerator, DocType } from '../tools/doc-generator.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { ToolCreator } from '../agent/tools/tool-creator.js'
import { logger } from '../utils/logger.js'

export const indexCommand = {
  name: 'index',
  description: 'Index a Git repository',
  usage: '/index [path] [--force]',
  execute: async (args: string = ''): Promise<string> => {
    try {
      const parts = args.split(/\s+/).filter(Boolean)
      const force = parts.includes('--force')
      const repoPath = parts.find((p) => p !== '--force') || '.'
      const pipeline = new IndexingPipeline(repoPath)
      const result = await pipeline.index(force)

      return [
        'Index complete',
        `Total commits: ${result.totalCommits}`,
        `Indexed: ${result.indexedCommits}`,
        `Skipped: ${result.skippedCommits}`,
        `Duration: ${result.duration}ms`,
        result.errors.length > 0 ? `Errors:\n${result.errors.join('\n')}` : undefined,
      ]
        .filter(Boolean)
        .join('\n')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Index command failed:', msg)
      return `Index failed: ${msg}`
    }
  },
}

export const queryCommand = {
  name: 'query',
  description: 'Ask a question about your indexed codebase',
  usage: '/query <question>',
  execute: async (args: string = ''): Promise<string> => {
    if (!args.trim()) return 'Usage: /query <question>'

    try {
      const engine = new QueryEngine()
      const result = await engine.query(args)
      engine.close()

      const evidence = result.evidence
        .slice(0, 5)
        .map((e) => `- ${e.hash.substring(0, 7)} ${e.message} (${e.score.toFixed(2)})`)
        .join('\n')

      return [
        result.answer,
        evidence ? `\nEvidence:\n${evidence}` : undefined,
        `\nDuration: ${result.duration}ms`,
      ]
        .filter(Boolean)
        .join('\n')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Query command failed:', msg)
      return `Query failed: ${msg}`
    }
  },
}

export const reviewCommand = {
  name: 'review',
  description: 'Review current branch changes against a base branch',
  usage: '/review [base]',
  execute: async (args: string = ''): Promise<string> => {
    try {
      clearProviderCache()
      const reviewer = new PRReviewer(getProvider())
      const result = await reviewer.review(args.trim() || 'main')
      const comments = result.comments
        .map((c) => `- [${c.severity}] ${c.file}${c.line ? `:${c.line}` : ''}: ${c.message}`)
        .join('\n')

      return [
        `Review: ${result.branch} -> ${result.baseBranch}`,
        `Files changed: ${result.totalChanges}`,
        result.summary,
        comments ? `\nComments:\n${comments}` : undefined,
        `\nDuration: ${result.duration}ms`,
      ]
        .filter(Boolean)
        .join('\n')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Review command failed:', msg)
      return `Review failed: ${msg}`
    }
  },
}

export const debtCommand = {
  name: 'debt',
  description: 'Analyze technical debt',
  usage: '/debt [branch]',
  execute: async (args: string = ''): Promise<string> => {
    try {
      clearProviderCache()
      const detector = new TechDebtDetector(getProvider())
      const report = await detector.analyze(args.trim() || 'HEAD')
      const items = report.items
        .slice(0, 10)
        .map((i) => `- [${i.severity}] ${i.file}: ${i.description}`)
        .join('\n')

      return [
        `Health score: ${report.healthScore}/100`,
        `Total items: ${report.totalItems}`,
        `Critical: ${report.breakdown.critical}`,
        `Warning: ${report.breakdown.warning}`,
        `Info: ${report.breakdown.info}`,
        items ? `\nTop issues:\n${items}` : undefined,
        `\nDuration: ${report.duration}ms`,
      ]
        .filter(Boolean)
        .join('\n')
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Debt command failed:', msg)
      return `Debt analysis failed: ${msg}`
    }
  },
}

export const docsCommand = {
  name: 'docs',
  description: 'Generate documentation',
  usage: '/docs <runbook|onboarding|decision-log|architecture>',
  execute: async (args: string = ''): Promise<string> => {
    const type = args.trim() as DocType
    const validTypes: DocType[] = ['runbook', 'onboarding', 'decision-log', 'architecture']
    if (!validTypes.includes(type)) {
      return `Usage: ${docsCommand.usage}`
    }

    try {
      clearProviderCache()
      const generator = new DocGenerator('.', getProvider())
      const result = await generator.generate(type)
      return `${result.content}\n\nGenerated ${result.type} (${result.wordCount} words) in ${result.duration}ms`
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Docs command failed:', msg)
      return `Documentation generation failed: ${msg}`
    }
  },
}

export const toolCommand = {
  name: 'tool',
  description: 'Create a new tool dynamically based on a requirement',
  usage: '/tool <description>',
  execute: async (args: string = ''): Promise<string> => {
    try {
      clearProviderCache()

      if (!args.trim()) {
        return 'Usage: /tool <description>\nExample: /tool Create a tool that converts markdown to HTML'
      }

      const creator = new ToolCreator(getProvider())
      const result = await creator.createToolFromRequirement(args, 'manual')

      if (result.success) {
        return [
          `Created new tool: ${result.toolName}`,
          '',
          'Metadata:',
          `- Name: ${result.metadata.name}`,
          `- Description: ${result.metadata.description}`,
          `- Parameters: ${Object.keys(result.metadata.parameters).join(', ') || '(none)'}`,
          `- Requires permission: ${result.metadata.requiresPermission}`,
          `- Status: ${result.metadata.status}`,
          '',
          `Source: ${result.metadata.sourcePath}`,
          `Compiled: ${result.metadata.compiledPath}`,
          'Restart Spectre to link this tool into the agent runtime. You can restart now or later.',
        ].join('\n')
      }

      return `Failed to create tool\n\nError: ${result.error}\n\nGenerated code:\n${result.code.substring(0, 500)}...`
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Tool creation failed:', msg)
      return `Tool creation failed: ${msg}`
    }
  },
}

export const toolsCommand = {
  name: 'tools',
  description: 'Manage dynamic tools',
  usage: '/tools <list|remove> [name]',
  execute: async (args: string = ''): Promise<string> => {
    try {
      const [action = 'list', name] = args.split(/\s+/).filter(Boolean)
      const creator = new ToolCreator(getProvider())

      if (action === 'list') {
        const tools = creator.loadDynamicTools()
        if (tools.length === 0) return 'No dynamic tools found. Use /tool <description> to create one.'

        return [
          `Dynamic tools (${tools.length}):`,
          ...tools.map(
            (tool) =>
              `- ${tool.name}: ${tool.description} (${tool.status}; ${tool.requiresPermission ? 'permission required' : 'no permission'})`,
          ),
        ].join('\n')
      }

      if (action === 'inspect') {
        if (!name) return 'Usage: /tools inspect <name>'
        const code = creator.getToolCode(name)
        if (!code) return `Tool not found: ${name}`
        return code
      }

      if (action === 'remove') {
        if (!name) return 'Usage: /tools remove <name>'
        return creator.removeTool(name) ? `Removed tool: ${name}` : `Tool not found: ${name}`
      }

      return `Unknown action: ${action}\nAvailable actions: list, inspect, remove`
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Tools command failed:', msg)
      return `Tools command failed: ${msg}`
    }
  },
}

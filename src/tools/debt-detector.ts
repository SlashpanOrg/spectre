import simpleGit, { SimpleGit } from 'simple-git'
import { AIProvider } from '../ai/provider.js'
import { logger } from '../utils/logger.js'

export interface DebtItem {
  file: string
  category: 'complexity' | 'duplication' | 'outdated' | 'missing-tests' | 'architecture'
  severity: 'critical' | 'warning' | 'info'
  description: string
  suggestion?: string
  lines?: string
}

export interface DebtReport {
  healthScore: number
  totalItems: number
  items: DebtItem[]
  breakdown: {
    critical: number
    warning: number
    info: number
  }
  categoryBreakdown: Record<string, number>
  duration: number
}

export class TechDebtDetector {
  private git: SimpleGit
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.git = simpleGit()
    this.provider = provider
  }

  async analyze(branch: string = 'HEAD'): Promise<DebtReport> {
    const startTime = Date.now()

    const recentCommits = await this.git.log({ '-n': '20' })
    const filesToAnalyze = await this.getRecentFiles(branch)

    if (filesToAnalyze.length === 0) {
      return {
        healthScore: 100,
        totalItems: 0,
        items: [],
        breakdown: { critical: 0, warning: 0, info: 0 },
        categoryBreakdown: {},
        duration: Date.now() - startTime,
      }
    }

    const fileContents = await this.getFileContents(filesToAnalyze.slice(0, 10))
    const items = await this.analyzeFiles(fileContents, recentCommits)

    const breakdown = {
      critical: items.filter((i) => i.severity === 'critical').length,
      warning: items.filter((i) => i.severity === 'warning').length,
      info: items.filter((i) => i.severity === 'info').length,
    }

    const categoryBreakdown: Record<string, number> = {}
    for (const item of items) {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1
    }

    const healthScore = this.calculateHealthScore(items, recentCommits.total)

    const duration = Date.now() - startTime

    logger.info(
      `Tech debt analysis complete: ${items.length} items found, health score: ${healthScore} in ${duration}ms`,
    )

    return {
      healthScore,
      totalItems: items.length,
      items,
      breakdown,
      categoryBreakdown,
      duration,
    }
  }

  private async getRecentFiles(branch: string): Promise<string[]> {
    try {
      const result = await this.git.diff([`${branch}~20..${branch}`, '--name-only'])
      return result.split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  private async getFileContents(
    files: string[],
  ): Promise<Array<{ path: string; content: string }>> {
    const results: Array<{ path: string; content: string }> = []

    for (const file of files) {
      try {
        const content = await this.git.show([`${file}`])
        if (content && content.length < 10000) {
          results.push({ path: file, content })
        }
      } catch {
        logger.warn(`Could not read file: ${file}`)
      }
    }

    return results
  }

  private async analyzeFiles(
    fileContents: Array<{ path: string; content: string }>,
    commits: { total: number },
  ): Promise<DebtItem[]> {
    const prompt = `You are Spectre, a tech debt analyzer. Analyze the following code files and identify technical debt.

Categories:
- complexity: High cyclomatic complexity, nested conditionals, long functions
- duplication: Repeated code patterns, copy-paste code
- outdated: Deprecated APIs, old patterns, TODO/FIXME comments
- missing-tests: Files that likely need test coverage
- architecture: Coupling issues, missing abstractions, violation of SOLID

Recent commits: ${commits.total}

Analyze these files:

${fileContents
  .map(
    (f) => `
--- ${f.path} ---
${f.content.substring(0, 3000)}
`,
  )
  .join('\n')}

Respond with a JSON array of debt items. Each item must have:
- "file": file path
- "category": one of "complexity", "duplication", "outdated", "missing-tests", "architecture"
- "severity": one of "critical", "warning", "info"
- "description": what the debt is
- "suggestion": optional how to fix it
- "lines": optional line numbers or range

Return ONLY valid JSON, no markdown, no explanation.`

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 4000,
    })

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const items = JSON.parse(jsonMatch[0]) as DebtItem[]
      return items.filter((i) => i.file && i.category && i.severity && i.description)
    } catch {
      logger.warn('Failed to parse debt items, returning empty')
      return []
    }
  }

  private calculateHealthScore(items: DebtItem[], commitCount: number): number {
    let score = 100

    score -= items.filter((i) => i.severity === 'critical').length * 15
    score -= items.filter((i) => i.severity === 'warning').length * 5
    score -= items.filter((i) => i.severity === 'info').length * 2

    if (commitCount > 100) {
      score -= 5
    }

    return Math.max(0, Math.min(100, score))
  }
}

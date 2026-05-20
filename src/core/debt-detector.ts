import { getProvider } from '../ai/config.js'
import { GitScanner } from './indexer.js'
import { logger } from '../utils/logger.js'

export interface DebtPattern {
  id: string
  type: 'complexity' | 'duplication' | 'outdated' | 'coupling' | 'technical'
  severity: 'high' | 'medium' | 'low'
  files: string[]
  description: string
  recommendation: string
  evidence: string
  trend: 'increasing' | 'stable' | 'decreasing'
}

export interface DebtReport {
  totalPatterns: number
  patterns: DebtPattern[]
  overallHealth: number
  bySeverity: Record<string, number>
  byType: Record<string, number>
  summary: string
}

const DEBT_SYSTEM_PROMPT = `You are Spectre, an AI Development Intelligence Agent analyzing technical debt.

Analyze the repository data for patterns of technical debt:
1. Complexity: Overly complex code, deep nesting, large functions
2. Duplication: Repeated code patterns across files
3. Outdated: Deprecated APIs, old patterns, unused code
4. Coupling: Tight coupling between modules, circular dependencies
5. Technical: Missing tests, poor error handling, no documentation

Look at commit messages, file change patterns, and code evolution over time.
Identify trends: is debt increasing, stable, or being addressed?

Provide specific evidence with file names and commit references.`

export class DebtDetector {
  private gitScanner: GitScanner

  constructor(repoPath: string = '.') {
    this.gitScanner = new GitScanner(repoPath)
  }

  async analyze(limit: number = 50): Promise<DebtReport> {
    const commits = await this.gitScanner.getCommits(undefined, limit)

    const provider = getProvider()

    const commitData = commits
      .map(
        (c) =>
          `${c.hash.substring(0, 7)} | ${c.author} | ${c.date} | ${c.message} | Files: ${c.files.join(', ')}`,
      )
      .join('\n')

    const prompt = `Analyze this repository's commit history for technical debt patterns.

Recent commits (${commits.length} total):
${commitData}

Identify technical debt patterns and provide a structured report.

Format your response as JSON:
{
  "patterns": [
    {
      "id": "debt-1",
      "type": "complexity|duplication|outdated|coupling|technical",
      "severity": "high|medium|low",
      "files": ["file1.ts", "file2.ts"],
      "description": "what the debt is",
      "recommendation": "how to fix it",
      "evidence": "commit hashes or specific evidence",
      "trend": "increasing|stable|decreasing"
    }
  ],
  "overallHealth": 7,
  "summary": "brief summary of the debt situation"
}`

    const response = await provider.generateCompletion(prompt, {
      systemPrompt: DEBT_SYSTEM_PROMPT,
      temperature: 0.2,
    })

    const report = this.parseDebtResponse(response, commits.length)
    logger.info(`Debt analysis complete: ${report.patterns.length} patterns found`)
    return report
  }

  private parseDebtResponse(response: string, _commitCount: number): DebtReport {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        totalPatterns: 0,
        patterns: [],
        overallHealth: 5,
        bySeverity: {},
        byType: {},
        summary: response.substring(0, 500),
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      const patterns: DebtPattern[] = parsed.patterns || []
      const bySeverity: Record<string, number> = {}
      const byType: Record<string, number> = {}

      for (const p of patterns) {
        bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1
        byType[p.type] = (byType[p.type] || 0) + 1
      }

      return {
        totalPatterns: patterns.length,
        patterns,
        overallHealth: parsed.overallHealth || 5,
        bySeverity,
        byType,
        summary: parsed.summary || '',
      }
    } catch {
      return {
        totalPatterns: 0,
        patterns: [],
        overallHealth: 5,
        bySeverity: {},
        byType: {},
        summary: response.substring(0, 500),
      }
    }
  }
}

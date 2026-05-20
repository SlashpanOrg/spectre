import simpleGit, { SimpleGit } from 'simple-git'
import { AIProvider } from '../ai/provider.js'
import { logger } from '../utils/logger.js'

export interface ReviewComment {
  file: string
  line?: number
  severity: 'critical' | 'warning' | 'info'
  message: string
  suggestion?: string
}

export interface ReviewResult {
  branch: string
  baseBranch: string
  totalChanges: number
  filesChanged: string[]
  comments: ReviewComment[]
  summary: string
  duration: number
}

export class PRReviewer {
  private git: SimpleGit
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.git = simpleGit()
    this.provider = provider
  }

  async review(baseBranch: string = 'main'): Promise<ReviewResult> {
    const startTime = Date.now()
    const currentBranch = await this.getCurrentBranch()

    const diffSummary = await this.git.diffSummary([`${baseBranch}..${currentBranch}`])

    const filesChanged = diffSummary.files.map((f) => f.file)
    const totalChanges = diffSummary.files.length

    if (totalChanges === 0) {
      return {
        branch: currentBranch,
        baseBranch,
        totalChanges: 0,
        filesChanged: [],
        comments: [],
        summary: 'No changes detected between branches.',
        duration: Date.now() - startTime,
      }
    }

    const diffContent = await this.getFullDiff(baseBranch, currentBranch)
    const comments = await this.analyzeDiff(diffContent, filesChanged)
    const summary = await this.generateSummary(comments, filesChanged)

    const duration = Date.now() - startTime

    logger.info(
      `PR review complete: ${comments.length} comments across ${filesChanged.length} files in ${duration}ms`,
    )

    return {
      branch: currentBranch,
      baseBranch,
      totalChanges,
      filesChanged,
      comments,
      summary,
      duration,
    }
  }

  private async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch()
    return branch.current
  }

  private async getFullDiff(baseBranch: string, currentBranch: string): Promise<string> {
    return this.git.diff([`${baseBranch}..${currentBranch}`, '--unified=3'])
  }

  private async analyzeDiff(diffContent: string, filesChanged: string[]): Promise<ReviewComment[]> {
    const prompt = `You are Spectre, an expert code reviewer. Analyze the following git diff and provide constructive feedback.

Focus on:
- Critical bugs, security vulnerabilities, logic errors
- Warnings: code smells, missing error handling, potential performance issues
- Info: style suggestions, minor improvements

Files changed: ${filesChanged.join(', ')}

Diff:
\`\`\`diff
${diffContent.substring(0, 15000)}
\`\`\`

Respond with a JSON array of review comments. Each comment must have:
- "file": the file path
- "line": optional line number
- "severity": one of "critical", "warning", "info"
- "message": the review comment
- "suggestion": optional suggested fix

Return ONLY valid JSON, no markdown, no explanation.`

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 4000,
    })

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const comments = JSON.parse(jsonMatch[0]) as ReviewComment[]
      return comments.filter((c) => c.file && c.severity && c.message)
    } catch {
      logger.warn('Failed to parse review comments, returning empty')
      return []
    }
  }

  private async generateSummary(
    comments: ReviewComment[],
    filesChanged: string[],
  ): Promise<string> {
    const critical = comments.filter((c) => c.severity === 'critical').length
    const warnings = comments.filter((c) => c.severity === 'warning').length
    const info = comments.filter((c) => c.severity === 'info').length

    return `Reviewed ${filesChanged.length} files: ${critical} critical, ${warnings} warnings, ${info} suggestions.`
  }
}

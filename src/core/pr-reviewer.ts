import { getProvider } from '../ai/config.js'
import { GitScanner } from './indexer.js'
import { logger } from '../utils/logger.js'

export interface ReviewComment {
  file: string
  line?: number
  severity: 'critical' | 'warning' | 'info'
  category: 'architecture' | 'security' | 'performance' | 'maintainability' | 'convention'
  message: string
  suggestion?: string
}

export interface PRReviewResult {
  summary: string
  comments: ReviewComment[]
  overallScore: number
  categories: Record<string, number>
}

const REVIEW_SYSTEM_PROMPT = `You are Spectre, an AI Development Intelligence Agent reviewing a pull request.

Analyze the changes for:
1. Architecture: Does this follow good architectural patterns? Any design issues?
2. Security: Any security vulnerabilities or risks?
3. Performance: Any performance concerns?
4. Maintainability: Is the code clean and maintainable?
5. Conventions: Does it follow common coding conventions?

Be specific, cite file names and line numbers when possible.
Provide actionable suggestions for each issue found.
Rate severity as: critical (must fix), warning (should fix), info (nice to have).`

export class PRReviewer {
  private gitScanner: GitScanner

  constructor(repoPath: string = '.') {
    this.gitScanner = new GitScanner(repoPath)
  }

  async review(baseBranch: string = 'main', currentBranch?: string): Promise<PRReviewResult> {
    const branch = currentBranch || (await this.gitScanner.getCurrentBranch())

    const diff = await this.getDiff(baseBranch, branch)
    const changedFiles = await this.getChangedFiles(baseBranch, branch)

    const provider = getProvider()

    const prompt = `Review this pull request from ${baseBranch} into ${branch}.

Changed files:
${changedFiles.map((f) => `- ${f}`).join('\n')}

Diff:
${diff.substring(0, 8000)}

Provide a structured review with:
1. A brief summary of the changes
2. Specific comments organized by category (architecture, security, performance, maintainability, convention)
3. An overall score from 1-10
4. Category scores from 1-10

Format your response as JSON with this structure:
{
  "summary": "brief summary",
  "comments": [
    {"file": "path/to/file", "severity": "critical|warning|info", "category": "architecture|security|performance|maintainability|convention", "message": "issue description", "suggestion": "how to fix"}
  ],
  "overallScore": 8,
  "categories": {"architecture": 8, "security": 7, "performance": 9, "maintainability": 8, "convention": 9}
}`

    const response = await provider.generateCompletion(prompt, {
      systemPrompt: REVIEW_SYSTEM_PROMPT,
      temperature: 0.2,
    })

    const result = this.parseReviewResponse(response)
    logger.info(
      `PR review complete: ${result.comments.length} comments, score ${result.overallScore}/10`,
    )
    return result
  }

  private async getDiff(baseBranch: string, currentBranch: string): Promise<string> {
    try {
      return await this.gitScanner['git'].diff([`${baseBranch}..${currentBranch}`])
    } catch {
      return 'Could not generate diff'
    }
  }

  private async getChangedFiles(baseBranch: string, currentBranch: string): Promise<string[]> {
    try {
      const result = await this.gitScanner['git'].diffSummary([`${baseBranch}..${currentBranch}`])
      return result.files.map((f) => f.file)
    } catch {
      return []
    }
  }

  private parseReviewResponse(response: string): PRReviewResult {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        summary: response.substring(0, 500),
        comments: [],
        overallScore: 5,
        categories: {},
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: parsed.summary || '',
        comments: parsed.comments || [],
        overallScore: parsed.overallScore || 5,
        categories: parsed.categories || {},
      }
    } catch {
      return {
        summary: response.substring(0, 500),
        comments: [],
        overallScore: 5,
        categories: {},
      }
    }
  }
}

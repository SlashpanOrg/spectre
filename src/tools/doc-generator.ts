import simpleGit, { SimpleGit } from 'simple-git'
import { AIProvider } from '../ai/provider.js'
import { logger } from '../utils/logger.js'
import fs from 'node:fs'
import path from 'node:path'

export type DocType = 'runbook' | 'onboarding' | 'decision-log' | 'architecture'

export interface DocResult {
  type: DocType
  title: string
  content: string
  generatedAt: string
  wordCount: number
  duration: number
}

export class DocGenerator {
  private git: SimpleGit
  private provider: AIProvider
  private repoPath: string

  constructor(repoPath: string = '.', provider: AIProvider) {
    this.repoPath = repoPath
    this.git = simpleGit(repoPath)
    this.provider = provider
  }

  async generate(type: DocType): Promise<DocResult> {
    const startTime = Date.now()

    const repoInfo = await this.gatherRepoInfo()

    const content = await this.generateDoc(type, repoInfo)
    const title = this.extractTitle(content, type)
    const wordCount = content.split(/\s+/).length
    const duration = Date.now() - startTime

    logger.info(`Generated ${type} doc: ${wordCount} words in ${duration}ms`)

    return {
      type,
      title,
      content,
      generatedAt: new Date().toISOString(),
      wordCount,
      duration,
    }
  }

  async export(doc: DocResult, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(outputPath, doc.content, 'utf-8')
    logger.info(`Exported ${doc.type} to ${outputPath}`)
  }

  private async gatherRepoInfo(): Promise<string> {
    const log = await this.git.log({ '-n': '50' })
    const branches = await this.git.branchLocal()
    const tags = await this.git.tags()

    const packageJsonPath = path.join(this.repoPath, 'package.json')
    const readmePath = path.join(this.repoPath, 'README.md')

    let packageJson = ''
    let readme = ''

    if (fs.existsSync(packageJsonPath)) {
      packageJson = fs.readFileSync(packageJsonPath, 'utf-8').substring(0, 2000)
    }

    if (fs.existsSync(readmePath)) {
      readme = fs.readFileSync(readmePath, 'utf-8').substring(0, 3000)
    }

    return `Repository: ${this.repoPath}
Branches: ${branches.all.join(', ')}
Tags: ${tags.all.join(', ')}
Total commits: ${log.total}

Recent commits:
${log.all
  .slice(0, 20)
  .map((c) => `- ${c.hash.substring(0, 7)}: ${c.message} (${c.author_name})`)
  .join('\n')}

package.json:
${packageJson}

README:
${readme}`
  }

  private async generateDoc(type: DocType, repoInfo: string): Promise<string> {
    const prompts: Record<DocType, string> = {
      runbook: `You are Spectre, generating an operational runbook for this repository.

Create a comprehensive runbook covering:
1. Overview and purpose
2. Setup and installation
3. Common operations and procedures
4. Troubleshooting guide
5. Monitoring and alerting
6. Rollback procedures

Repository context:
${repoInfo}

Format as markdown. Be specific and actionable.`,

      onboarding: `You are Spectre, generating an onboarding guide for new developers joining this project.

Create a comprehensive onboarding guide covering:
1. Project overview and architecture
2. Development environment setup
3. Codebase structure and key components
4. Development workflow (branching, PRs, testing)
5. Common tasks and how to do them
6. Team conventions and best practices
7. Resources and further reading

Repository context:
${repoInfo}

Format as markdown. Be welcoming and thorough.`,

      'decision-log': `You are Spectre, generating an Architecture Decision Record (ADR) log for this repository.

Analyze the commit history and codebase to infer key architectural decisions. Create an ADR log covering:
1. Technology choices (language, framework, database)
2. Architecture patterns used
3. API design decisions
4. Testing strategy
5. Deployment approach
6. Notable refactoring decisions

Repository context:
${repoInfo}

Format as markdown with ADR-style entries. Include context, decision, and consequences for each.`,

      architecture: `You are Spectre, generating an architecture overview document for this repository.

Create a comprehensive architecture document covering:
1. System overview and high-level design
2. Component diagram (text-based)
3. Data flow and dependencies
4. Key design patterns used
5. Integration points (external services, APIs)
6. Scalability considerations
7. Security architecture

Repository context:
${repoInfo}

Format as markdown. Use clear headings and diagrams where helpful.`,
    }

    return this.provider.generateCompletion(prompts[type], {
      temperature: 0.5,
      maxTokens: 8000,
    })
  }

  private extractTitle(content: string, type: DocType): string {
    const firstLine = content.split('\n').find((line) => line.startsWith('# '))
    if (firstLine) {
      return firstLine.replace(/^#\s*/, '')
    }

    const titles: Record<DocType, string> = {
      runbook: 'Operational Runbook',
      onboarding: 'Developer Onboarding Guide',
      'decision-log': 'Architecture Decision Log',
      architecture: 'Architecture Overview',
    }

    return titles[type]
  }
}

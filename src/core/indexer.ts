import simpleGit, { SimpleGit, LogResult } from 'simple-git'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from '../utils/logger.js'

export interface CommitData {
  hash: string
  author: string
  email: string
  date: string
  message: string
  files: string[]
  branch: string
}

export interface IndexProgress {
  total: number
  current: number
  percentage: number
  currentCommit?: string
}

export type ProgressCallback = (progress: IndexProgress) => void

export class GitScanner {
  private git: SimpleGit
  private repoPath: string

  constructor(repoPath: string = '.') {
    this.repoPath = path.resolve(repoPath)
    this.git = simpleGit(this.repoPath)
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.checkIsRepo()
      return true
    } catch {
      return false
    }
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch()
    return branch.current
  }

  async getCommitCount(): Promise<number> {
    const log = await this.git.log()
    return log.total
  }

  async getCommits(
    since?: string,
    limit?: number,
    onProgress?: ProgressCallback,
  ): Promise<CommitData[]> {
    const currentBranch = await this.getCurrentBranch()
    const logOptions: string[] = []

    if (since) {
      logOptions.push(`--since=${since}`)
    }

    const log: LogResult = await this.git.log({
      from: since || '',
      maxCount: limit,
    })

    const commits: CommitData[] = []
    const total = log.total

    for (let i = 0; i < log.all.length; i++) {
      const entry = log.all[i]
      const files = await this.getFilesInCommit(entry.hash)

      const commit: CommitData = {
        hash: entry.hash,
        author: entry.author_name,
        email: entry.author_email,
        date: entry.date,
        message: entry.message,
        files,
        branch: currentBranch,
      }

      commits.push(commit)

      if (onProgress) {
        onProgress({
          total,
          current: i + 1,
          percentage: Math.round(((i + 1) / total) * 100),
          currentCommit: entry.hash.substring(0, 7),
        })
      }
    }

    logger.info(`Scanned ${commits.length} commits from ${this.repoPath}`)
    return commits
  }

  async getFilesInCommit(hash: string): Promise<string[]> {
    try {
      const result = await this.git.diffSummary([`${hash}^`, hash])
      return result.files.map((f) => f.file)
    } catch {
      return []
    }
  }

  async getBranches(): Promise<string[]> {
    const branches = await this.git.branchLocal()
    return branches.all
  }

  async getTags(): Promise<string[]> {
    const tags = await this.git.tags()
    return tags.all
  }

  async getFileContent(filePath: string, ref: string = 'HEAD'): Promise<string> {
    return await this.git.show([`${ref}:${filePath}`])
  }

  async getLastIndexedCommit(): Promise<string | undefined> {
    const indexPath = path.join(this.repoPath, '.spectre', 'last-indexed')
    if (fs.existsSync(indexPath)) {
      return fs.readFileSync(indexPath, 'utf-8').trim()
    }
    return undefined
  }

  async saveLastIndexedCommit(hash: string): Promise<void> {
    const spectreDir = path.join(this.repoPath, '.spectre')
    if (!fs.existsSync(spectreDir)) {
      fs.mkdirSync(spectreDir, { recursive: true })
    }
    const indexPath = path.join(spectreDir, 'last-indexed')
    fs.writeFileSync(indexPath, hash, 'utf-8')
  }
}

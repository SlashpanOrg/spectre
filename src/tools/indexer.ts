import simpleGit, { SimpleGit, LogResult } from 'simple-git'
import fs from 'node:fs'
import path from 'node:path'
import { logger } from '../utils/logger.js'
import { getRepoStateDir, getRepoStateFile } from '../utils/config.js'

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

  async getCommits(since?: string, onProgress?: ProgressCallback): Promise<CommitData[]> {
    const currentBranch = await this.getCurrentBranch()
    const logOptions = since ? { from: since, to: 'HEAD' } : undefined
    const log: LogResult = await this.git.log(logOptions)

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

  async getCommitDiff(hash: string, maxBytes: number = 50_000): Promise<string> {
    try {
      const diff = await this.git.raw(['show', '--format=', '--no-ext-diff', '--unified=80', hash])
      return diff.length > maxBytes ? `${diff.slice(0, maxBytes)}\n[diff truncated]` : diff
    } catch (error) {
      logger.warn(`Failed to read diff for ${hash.substring(0, 7)}:`, error)
      return ''
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

  async getLastIndexedCommit(): Promise<string | undefined> {
    const branch = await this.getCurrentBranch()
    const statePath = getRepoStateFile(this.repoPath, branch)
    if (fs.existsSync(statePath)) {
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as { lastIndexedCommit?: string }
      return raw.lastIndexedCommit
    }
    return undefined
  }

  async saveLastIndexedCommit(hash: string): Promise<void> {
    const branch = await this.getCurrentBranch()
    const stateDir = getRepoStateDir()
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 })
    }
    const statePath = getRepoStateFile(this.repoPath, branch)
    fs.writeFileSync(
      statePath,
      JSON.stringify(
        {
          repoPath: this.repoPath,
          branch,
          lastIndexedCommit: hash,
          savedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      { encoding: 'utf-8', mode: 0o600 },
    )
  }
}

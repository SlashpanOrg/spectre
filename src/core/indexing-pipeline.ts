import { GitScanner, CommitData, IndexProgress } from './indexer.js'
import { VectorStore, VectorPoint } from '../storage/vector-store.js'
import { MetadataStore } from '../storage/metadata-store.js'
import { getProvider } from '../ai/config.js'
import { loadConfig, saveConfig } from '../utils/config.js'
import { logger } from '../utils/logger.js'
import crypto from 'node:crypto'

export interface IndexResult {
  totalCommits: number
  indexedCommits: number
  skippedCommits: number
  duration: number
  errors: string[]
}

export class IndexingPipeline {
  private scanner: GitScanner
  private vectorStore: VectorStore
  private metadataStore: MetadataStore

  constructor(repoPath: string) {
    this.scanner = new GitScanner(repoPath)
    const config = loadConfig()
    this.vectorStore = new VectorStore(config.qdrantUrl)
    this.metadataStore = new MetadataStore(config.dbPath)
  }

  async index(
    forceFull: boolean = false,
    onProgress?: (progress: IndexProgress) => void,
  ): Promise<IndexResult> {
    const startTime = Date.now()
    const errors: string[] = []

    if (!(await this.scanner.isGitRepo())) {
      throw new Error('Not a Git repository')
    }

    await this.vectorStore.initialize()

    const branch = await this.scanner.getCurrentBranch()
    const lastIndexed = forceFull ? undefined : await this.scanner.getLastIndexedCommit()

    logger.info(
      `Starting indexing${forceFull ? ' (full)' : ''}${lastIndexed ? ` since ${lastIndexed.substring(0, 7)}` : ''}`,
    )

    const commits = await this.scanner.getCommits(lastIndexed, undefined, onProgress)
    const provider = getProvider()

    let indexedCount = 0
    let skippedCount = 0

    for (const commit of commits) {
      try {
        const embeddingId = await this.indexCommit(commit, provider)
        this.metadataStore.cacheCommit(
          commit.hash,
          commit.author,
          commit.email,
          commit.date,
          commit.message,
          commit.files,
          commit.branch,
          embeddingId,
        )
        indexedCount++
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        errors.push(`Commit ${commit.hash.substring(0, 7)}: ${msg}`)
        skippedCount++
        logger.warn(`Skipping commit ${commit.hash.substring(0, 7)}: ${msg}`)
      }
    }

    if (commits.length > 0) {
      const lastHash = commits[commits.length - 1].hash
      await this.scanner.saveLastIndexedCommit(lastHash)

      const repoId = crypto.createHash('md5').update(this.scanner['repoPath']).digest('hex')
      this.metadataStore.saveRepo({
        id: repoId,
        path: this.scanner['repoPath'],
        branch,
        lastIndexedAt: new Date().toISOString(),
        commitCount: await this.scanner.getCommitCount(),
        indexedCommitHash: lastHash,
      })

      const config = loadConfig()
      if (!config.indexedRepos.includes(this.scanner['repoPath'])) {
        config.indexedRepos.push(this.scanner['repoPath'])
        config.lastIndexedAt = new Date().toISOString()
        saveConfig(config)
      }
    }

    const duration = Date.now() - startTime

    const result: IndexResult = {
      totalCommits: commits.length + skippedCount,
      indexedCommits: indexedCount,
      skippedCommits: skippedCount,
      duration,
      errors,
    }

    logger.info(
      `Indexing complete: ${indexedCount} indexed, ${skippedCount} skipped in ${duration}ms`,
    )
    return result
  }

  private async indexCommit(
    commit: CommitData,
    provider: ReturnType<typeof getProvider>,
  ): Promise<string> {
    const content = this.buildCommitContent(commit)
    const embedding = await provider.generateEmbedding(content)

    const point: VectorPoint = {
      id: commit.hash,
      vector: embedding,
      payload: {
        type: 'commit',
        hash: commit.hash,
        author: commit.author,
        email: commit.email,
        date: commit.date,
        message: commit.message,
        files: commit.files,
        branch: commit.branch,
      },
    }

    await this.vectorStore.upsertPoints([point])
    return commit.hash
  }

  private buildCommitContent(commit: CommitData): string {
    return `Commit: ${commit.hash}
Author: ${commit.author} <${commit.email}>
Date: ${commit.date}
Branch: ${commit.branch}
Message: ${commit.message}
Files: ${commit.files.join(', ')}`
  }

  async getStats(): Promise<{ totalPoints: number; repos: number }> {
    const points = await this.vectorStore.getPointCount()
    const repos = this.metadataStore.getAllRepos()
    return { totalPoints: points, repos: repos.length }
  }

  close(): void {
    this.metadataStore.close()
  }
}

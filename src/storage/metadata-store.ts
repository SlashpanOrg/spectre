import Database from 'better-sqlite3'
import path from 'node:path'
import { CONFIG_DIR } from '../utils/config.js'
import { logger } from '../utils/logger.js'

export interface RepoMetadata {
  id: string
  path: string
  branch: string
  lastIndexedAt: string
  commitCount: number
  indexedCommitHash: string
}

export interface QueryHistory {
  id: string
  query: string
  answer: string
  timestamp: string
  evidenceCount: number
}

export class MetadataStore {
  private db: Database.Database

  constructor(dbPath: string = path.join(CONFIG_DIR, 'spectre.db')) {
    this.db = new Database(dbPath)
    this.initialize()
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repos (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        branch TEXT NOT NULL,
        last_indexed_at TEXT,
        commit_count INTEGER DEFAULT 0,
        indexed_commit_hash TEXT
      );

      CREATE TABLE IF NOT EXISTS query_history (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        answer TEXT,
        timestamp TEXT NOT NULL,
        evidence_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS commit_cache (
        hash TEXT PRIMARY KEY,
        author TEXT,
        email TEXT,
        date TEXT,
        message TEXT,
        files TEXT,
        branch TEXT,
        embedding_id TEXT
      );
    `)

    logger.debug('Metadata store initialized')
  }

  saveRepo(metadata: RepoMetadata): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO repos (id, path, branch, last_indexed_at, commit_count, indexed_commit_hash)
       VALUES (@id, @path, @branch, @lastIndexedAt, @commitCount, @indexedCommitHash)`,
      )
      .run({
        id: metadata.id,
        path: metadata.path,
        branch: metadata.branch,
        lastIndexedAt: metadata.lastIndexedAt,
        commitCount: metadata.commitCount,
        indexedCommitHash: metadata.indexedCommitHash,
      })
  }

  getRepo(repoPath: string): RepoMetadata | undefined {
    return this.db.prepare('SELECT * FROM repos WHERE path = ?').get(repoPath) as
      | RepoMetadata
      | undefined
  }

  getAllRepos(): RepoMetadata[] {
    return this.db.prepare('SELECT * FROM repos').all() as RepoMetadata[]
  }

  saveQuery(query: QueryHistory): void {
    this.db
      .prepare(
        `INSERT INTO query_history (id, query, answer, timestamp, evidence_count)
       VALUES (@id, @query, @answer, @timestamp, @evidenceCount)`,
      )
      .run({
        id: query.id,
        query: query.query,
        answer: query.answer,
        timestamp: query.timestamp,
        evidenceCount: query.evidenceCount,
      })
  }

  getQueryHistory(limit: number = 20): QueryHistory[] {
    return this.db
      .prepare('SELECT * FROM query_history ORDER BY timestamp DESC LIMIT ?')
      .all(limit) as QueryHistory[]
  }

  cacheCommit(
    hash: string,
    author: string,
    email: string,
    date: string,
    message: string,
    files: string[],
    branch: string,
    embeddingId: string,
  ): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO commit_cache
       (hash, author, email, date, message, files, branch, embedding_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(hash, author, email, date, message, JSON.stringify(files), branch, embeddingId)
  }

  getCachedCommit(hash: string):
    | {
        hash: string
        author: string
        email: string
        date: string
        message: string
        files: string[]
        branch: string
        embeddingId: string
      }
    | undefined {
    const row = this.db.prepare('SELECT * FROM commit_cache WHERE hash = ?').get(hash) as
      | Record<string, unknown>
      | undefined

    if (!row) return undefined

    return {
      hash: row.hash as string,
      author: row.author as string,
      email: row.email as string,
      date: row.date as string,
      message: row.message as string,
      files: JSON.parse(row.files as string) as string[],
      branch: row.branch as string,
      embeddingId: row.embedding_id as string,
    }
  }

  close(): void {
    this.db.close()
  }
}

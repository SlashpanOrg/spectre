import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MetadataStore } from '../../src/storage/metadata-store.js'
import fs from 'node:fs'
import path from 'node:path'

describe('MetadataStore', () => {
  let store: MetadataStore
  const testDbPath = '/tmp/spectre-test-metadata.db'

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    store = new MetadataStore(testDbPath)
  })

  afterEach(() => {
    store.close()
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
  })

  it('should initialize database tables', () => {
    expect(fs.existsSync(testDbPath)).toBe(true)
  })

  it('should save and retrieve repo metadata', () => {
    const metadata = {
      id: 'test-repo-1',
      path: '/tmp/test-repo',
      branch: 'main',
      lastIndexedAt: '2026-01-01T00:00:00Z',
      commitCount: 10,
      indexedCommitHash: 'abc123',
    }

    store.saveRepo(metadata)
    const retrieved = store.getRepo('/tmp/test-repo')

    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe('test-repo-1')
    expect(retrieved?.commitCount).toBe(10)
  })

  it('should update existing repo metadata', () => {
    const metadata = {
      id: 'test-repo-1',
      path: '/tmp/test-repo',
      branch: 'main',
      lastIndexedAt: '2026-01-01T00:00:00Z',
      commitCount: 10,
      indexedCommitHash: 'abc123',
    }

    store.saveRepo(metadata)
    metadata.commitCount = 15
    metadata.indexedCommitHash = 'def456'
    store.saveRepo(metadata)

    const retrieved = store.getRepo('/tmp/test-repo')
    expect(retrieved?.commitCount).toBe(15)
    expect(retrieved?.indexedCommitHash).toBe('def456')
  })

  it('should get all repos', () => {
    store.saveRepo({
      id: 'repo-1',
      path: '/tmp/repo-1',
      branch: 'main',
      lastIndexedAt: '2026-01-01T00:00:00Z',
      commitCount: 5,
      indexedCommitHash: 'aaa',
    })
    store.saveRepo({
      id: 'repo-2',
      path: '/tmp/repo-2',
      branch: 'develop',
      lastIndexedAt: '2026-01-02T00:00:00Z',
      commitCount: 10,
      indexedCommitHash: 'bbb',
    })

    const repos = store.getAllRepos()
    expect(repos).toHaveLength(2)
  })

  it('should save and retrieve query history', () => {
    const query = {
      id: 'query-1',
      query: 'What changed in the last sprint?',
      answer: 'Based on the commit history...',
      timestamp: '2026-01-01T00:00:00Z',
      evidenceCount: 5,
    }

    store.saveQuery(query)
    const history = store.getQueryHistory()

    expect(history).toHaveLength(1)
    expect(history[0].query).toBe('What changed in the last sprint?')
    expect(history[0].evidenceCount).toBe(5)
  })

  it('should cache and retrieve commit data', () => {
    store.cacheCommit(
      'abc123',
      'Test User',
      'test@example.com',
      '2026-01-01T00:00:00Z',
      'Initial commit',
      ['src/index.ts', 'README.md'],
      'main',
      'embedding-1',
    )

    const cached = store.getCachedCommit('abc123')
    expect(cached).toBeDefined()
    expect(cached?.author).toBe('Test User')
    expect(cached?.files).toEqual(['src/index.ts', 'README.md'])
    expect(cached?.embeddingId).toBe('embedding-1')
  })

  it('should return undefined for non-cached commit', () => {
    const cached = store.getCachedCommit('nonexistent')
    expect(cached).toBeUndefined()
  })
})

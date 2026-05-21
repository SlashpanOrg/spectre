import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GitScanner } from '../../src/tools/indexer.js'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('simple-git', () => {
  const mockGit = {
    checkIsRepo: vi.fn().mockResolvedValue(true),
    branch: vi.fn().mockResolvedValue({ current: 'main' }),
    log: vi.fn().mockResolvedValue({
      total: 2,
      all: [
        {
          hash: 'abc123',
          author_name: 'Test User',
          author_email: 'test@example.com',
          date: '2026-01-01T00:00:00Z',
          message: 'Initial commit',
        },
        {
          hash: 'def456',
          author_name: 'Test User',
          author_email: 'test@example.com',
          date: '2026-01-02T00:00:00Z',
          message: 'Add feature',
        },
      ],
    }),
    diffSummary: vi.fn().mockResolvedValue({
      files: [{ file: 'src/index.ts' }, { file: 'README.md' }],
    }),
    branchLocal: vi.fn().mockResolvedValue({ all: ['main', 'develop'] }),
    tags: vi.fn().mockResolvedValue({ all: ['v1.0.0', 'v1.1.0'] }),
    raw: vi.fn().mockResolvedValue('diff --git a/src/index.ts b/src/index.ts\n+console.log("hello")'),
  }

  return {
    default: vi.fn(() => mockGit),
  }
})

describe('GitScanner', () => {
  let scanner: GitScanner
  const testDir = '/tmp/spectre-test-git'

  beforeEach(() => {
    vi.clearAllMocks()
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
    scanner = new GitScanner(testDir)
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true })
    }
    delete process.env.SPECTRE_CONFIG_DIR
  })

  it('should detect if directory is a git repo', async () => {
    const result = await scanner.isGitRepo()
    expect(result).toBe(true)
  })

  it('should get current branch', async () => {
    const branch = await scanner.getCurrentBranch()
    expect(branch).toBe('main')
  })

  it('should get commit count', async () => {
    const count = await scanner.getCommitCount()
    expect(count).toBe(2)
  })

  it('should get commits with progress', async () => {
    const progressCallback = vi.fn()
    const commits = await scanner.getCommits(undefined, progressCallback)

    expect(commits).toHaveLength(2)
    expect(commits[0].hash).toBe('abc123')
    expect(commits[0].author).toBe('Test User')
    expect(commits[0].files).toEqual(['src/index.ts', 'README.md'])
    expect(progressCallback).toHaveBeenCalled()
  })

  it('should get files in commit', async () => {
    const files = await scanner.getFilesInCommit('abc123')
    expect(files).toEqual(['src/index.ts', 'README.md'])
  })

  it('should get the diff for a commit', async () => {
    const diff = await scanner.getCommitDiff('abc123')
    expect(diff).toContain('diff --git')
    expect(diff).toContain('console.log')
  })

  it('should get branches', async () => {
    const branches = await scanner.getBranches()
    expect(branches).toEqual(['main', 'develop'])
  })

  it('should get tags', async () => {
    const tags = await scanner.getTags()
    expect(tags).toEqual(['v1.0.0', 'v1.1.0'])
  })

  it('should save and load last indexed commit', async () => {
    process.env.SPECTRE_CONFIG_DIR = path.join(testDir, '.spectre-config')
    await scanner.saveLastIndexedCommit('abc123')
    const loaded = await scanner.getLastIndexedCommit()
    expect(loaded).toBe('abc123')
    expect(fs.existsSync(path.join(testDir, '.spectre'))).toBe(false)
  })

  it('should return undefined for last indexed commit when not set', async () => {
    const loaded = await scanner.getLastIndexedCommit()
    expect(loaded).toBeUndefined()
  })
})

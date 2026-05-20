import { describe, it, expect } from 'vitest'
import { GitScanner } from '../../src/core/indexer.js'

describe('GitScanner', () => {
  it('should detect valid git repo', async () => {
    const scanner = new GitScanner('.')
    const isRepo = await scanner.isGitRepo()
    expect(isRepo).toBe(true)
  })

  it('should get current branch', async () => {
    const scanner = new GitScanner('.')
    const branch = await scanner.getCurrentBranch()
    expect(branch).toBe('main')
  })

  it('should get commit count', async () => {
    const scanner = new GitScanner('.')
    const count = await scanner.getCommitCount()
    expect(count).toBeGreaterThan(0)
  })

  it('should get commits', async () => {
    const scanner = new GitScanner('.')
    const commits = await scanner.getCommits(undefined, 5)
    expect(commits.length).toBeGreaterThan(0)
    expect(commits[0]).toHaveProperty('hash')
    expect(commits[0]).toHaveProperty('author')
    expect(commits[0]).toHaveProperty('message')
    expect(commits[0]).toHaveProperty('files')
  })

  it('should get branches', async () => {
    const scanner = new GitScanner('.')
    const branches = await scanner.getBranches()
    expect(branches.length).toBeGreaterThan(0)
  })
})

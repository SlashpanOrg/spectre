import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryManager } from '../../src/agent/memory.js'
import { existsSync, rmSync, mkdirSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('MemoryManager', () => {
  let testDir: string
  let manager: MemoryManager

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-memory-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.env.HOME = testDir
    manager = new MemoryManager('/test/project')
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should create memory directory and files on initialization', async () => {
    const memoryDir = manager.getMemoryDir()
    expect(existsSync(memoryDir)).toBe(true)

    const files = await manager.list()
    expect(files.length).toBe(6)
  })

  it('should load all memory files', async () => {
    const store = await manager.load()

    expect(store.soul).toBeDefined()
    expect(store.identity).toBeDefined()
    expect(store.information).toBeDefined()
    expect(store.permission).toBeDefined()
    expect(store.diary).toBeDefined()
    expect(store.skills).toBeDefined()
  })

  it('should save and reload memory', async () => {
    const store = await manager.load()
    store.soul = 'Updated soul content'
    await manager.save(store)

    manager.clearCache()
    const reloaded = await manager.load()
    expect(reloaded.soul).toBe('Updated soul content')
  })

  it('should get a single memory file', async () => {
    const content = await manager.get('soul')
    expect(content).toContain('Agent Personality')
  })

  it('should update a memory file', async () => {
    await manager.update('information', 'New project info')
    const content = await manager.get('information')
    expect(content).toBe('New project info')
  })

  it('should append to a memory file', async () => {
    await manager.append('diary', 'Entry 1')
    await manager.append('diary', 'Entry 2')

    const content = await manager.get('diary')
    expect(content).toContain('Entry 1')
    expect(content).toContain('Entry 2')
  })

  it('should append diary entry with timestamp', async () => {
    await manager.appendDiaryEntry('Learned user prefers TypeScript')
    const diary = await manager.get('diary')

    expect(diary).toContain('Learned user prefers TypeScript')
  })

  it('should update information only if not already present', async () => {
    await manager.updateInformation('Architecture: MVC pattern')
    await manager.updateInformation('Architecture: MVC pattern')

    const info = await manager.get('information')
    const matches = info.match(/Architecture: MVC pattern/g)
    expect(matches?.length).toBe(1)
  })

  it('should add skill only if not already present', async () => {
    await manager.addSkill('React component patterns')
    await manager.addSkill('React component patterns')

    const skills = await manager.get('skills')
    const matches = skills.match(/React component patterns/g)
    expect(matches?.length).toBe(1)
  })

  it('should generate system prompt with memory context', async () => {
    const prompt = await manager.getSystemPrompt()

    expect(prompt).toContain('You are Spectre')
    expect(prompt).toContain('Your Identity')
    expect(prompt).toContain('Your Personality')
    expect(prompt).toContain('Project Knowledge')
  })

  it('should cache loaded memory', async () => {
    await manager.load()
    const store1 = await manager.load()
    const store2 = await manager.load()

    expect(store1).toBe(store2)
  })

  it('should clear cache', async () => {
    await manager.load()
    manager.clearCache()

    const store = await manager.load()
    expect(store.soul).toBeDefined()
  })
})

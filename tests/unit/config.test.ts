import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  loadConfig,
  saveConfig,
  addProvider,
  setActiveProvider,
  getActiveProvider,
  removeProvider,
  getConfigFile,
  getRepoStateFile,
  updateActiveProviderModel,
  setActiveEmbeddingProvider,
  getActiveEmbeddingProvider,
  encryptKey,
  decryptKey,
} from '../../src/utils/config.js'

const TEST_CONFIG_DIR = '/tmp/spectre-test-config-unit'

describe('Config Management', () => {
  beforeEach(() => {
    process.env.SPECTRE_CONFIG_DIR = TEST_CONFIG_DIR
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    }
    delete process.env.SPECTRE_CONFIG_DIR
  })

  it('should create default config when none exists', () => {
    const config = loadConfig()
    expect(config).toBeDefined()
    expect(config.version).toBe('0.1.0')
    expect(config.activeProvider).toBe('openai')
  })

  it('should save and load config', () => {
    const config = loadConfig()
    config.qdrantUrl = 'http://test:6333'
    saveConfig(config)

    const loaded = loadConfig()
    expect(loaded.qdrantUrl).toBe('http://test:6333')
  })

  it('should protect config directory and file permissions', () => {
    const config = loadConfig()
    saveConfig(config)

    const dirMode = fs.statSync(TEST_CONFIG_DIR).mode & 0o777
    const fileMode = fs.statSync(getConfigFile()).mode & 0o777

    expect(dirMode).toBe(0o700)
    expect(fileMode).toBe(0o600)
  })

  it('should use SPECTRE_QDRANT_URL for new default configs', () => {
    fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    process.env.SPECTRE_QDRANT_URL = 'http://qdrant:6333'

    const config = loadConfig()

    expect(config.qdrantUrl).toBe('http://qdrant:6333')
    delete process.env.SPECTRE_QDRANT_URL
  })

  it('should create repo state paths under the Spectre config dir, not target repos', () => {
    const repoPath = '/tmp/some-target-repo'
    const stateFile = getRepoStateFile(repoPath, 'main')

    expect(stateFile.startsWith(path.join(TEST_CONFIG_DIR, 'repo-state'))).toBe(true)
    expect(stateFile.startsWith(repoPath)).toBe(false)
  })

  it('should add a provider', () => {
    addProvider({
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: true,
    })

    const config = loadConfig()
    expect(config.providers).toHaveLength(1)
    expect(config.providers[0].name).toBe('openai')
  })

  it('should set active provider', () => {
    addProvider({
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: false,
    })
    addProvider({
      name: 'anthropic',
      apiKey: 'test-key',
      model: 'claude-sonnet-4-20250514',
      isActive: false,
    })

    setActiveProvider('anthropic')
    const active = getActiveProvider()
    expect(active?.name).toBe('anthropic')
  })

  it('should update active provider model without changing the active provider', () => {
    addProvider({
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: true,
    })

    const updated = updateActiveProviderModel('gpt-4o-mini')
    const active = getActiveProvider()

    expect(updated.model).toBe('gpt-4o-mini')
    expect(active?.name).toBe('openai')
    expect(active?.model).toBe('gpt-4o-mini')
  })

  it('should set and retrieve a dedicated embedding provider', () => {
    addProvider({
      name: 'anthropic',
      apiKey: 'chat-key',
      model: 'claude-sonnet-4-20250514',
      isActive: true,
    })
    addProvider({
      name: 'openai',
      apiKey: 'embedding-key',
      model: 'gpt-4o',
      isActive: false,
    })

    setActiveEmbeddingProvider('openai')

    expect(loadConfig().activeProvider).toBe('anthropic')
    expect(loadConfig().activeEmbeddingProvider).toBe('openai')
    expect(getActiveEmbeddingProvider()?.name).toBe('openai')
  })

  it('should encrypt with a local derived key while still decrypting legacy hardcoded-key values', () => {
    const encrypted = encryptKey('secret-key')

    expect(encrypted).not.toContain('secret-key')
    expect(decryptKey(encrypted)).toBe('secret-key')
    expect(decryptKey('U2FsdGVkX1/OjAvt1WxVeoQxF8jud3zscZKMmERg4DI=')).toBe('legacy-secret')
  })

  it('should remove a provider', () => {
    const config = loadConfig()
    config.providers = []
    saveConfig(config)

    addProvider({
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: true,
    })

    removeProvider('openai')
    const loaded = loadConfig()
    expect(loaded.providers).toHaveLength(0)
  })
})

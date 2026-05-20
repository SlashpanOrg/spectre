import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig, saveConfig, addProvider, setActiveProvider, getActiveProvider, removeProvider } from '../../src/utils/config.js'

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

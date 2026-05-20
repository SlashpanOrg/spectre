import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig, saveConfig, addProvider, setActiveProvider, getActiveProvider, removeProvider, CONFIG_DIR } from '../../src/utils/config.js'

const TEST_CONFIG_DIR = path.join(CONFIG_DIR, 'test')
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json')

describe('Config Management', () => {
  beforeEach(() => {
    // Reset config to clean state before each test
    const config = loadConfig()
    config.providers = []
    config.activeProvider = 'openai'
    saveConfig(config)
  })

  it('should create default config when none exists', () => {
    const config = loadConfig()
    expect(config).toBeDefined()
    expect(config.version).toBe('0.1.0')
    expect(config.providers).toEqual([])
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
    // Clean slate
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

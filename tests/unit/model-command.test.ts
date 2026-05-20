import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import { modelCommand } from '../../src/commands/model.js'
import { loadConfig, saveConfig } from '../../src/utils/config.js'

const TEST_CONFIG_DIR = '/tmp/spectre-test-config-model'

describe('Model Command', () => {
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

  it('should show error when no provider configured', async () => {
    const result = await modelCommand.execute('')
    expect(result).toContain('No provider configured')
    expect(result).toContain('/setup')
  })

  it('should show current model when no args', async () => {
    const config = loadConfig()
    config.providers = [{
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: true,
    }]
    config.activeProvider = 'openai'
    saveConfig(config)

    const verifyConfig = loadConfig()
    expect(verifyConfig.activeProvider).toBe('openai')
    expect(verifyConfig.providers[0].isActive).toBe(true)

    const result = await modelCommand.execute('')
    expect(result).toContain('Current provider: openai')
    expect(result).toContain('Current model: gpt-4o')
    expect(result).toContain('gpt-4o')
    expect(result).toContain('gpt-4o-mini')
  })

  it('should switch to valid model', async () => {
    const config = loadConfig()
    config.providers = [{
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: true,
    }]
    config.activeProvider = 'openai'
    saveConfig(config)

    const result = await modelCommand.execute('gpt-4o-mini')
    expect(result).toContain('Switched to')
    expect(result).toContain('gpt-4o-mini')
  })

  it('should allow custom model name', async () => {
    const config = loadConfig()
    config.providers = [{
      name: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o',
      isActive: true,
    }]
    config.activeProvider = 'openai'
    saveConfig(config)

    const result = await modelCommand.execute('custom-model-name')
    expect(result).toContain('Switched to')
    expect(result).toContain('custom-model-name')
  })
})

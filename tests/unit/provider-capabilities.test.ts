import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import { addProvider, encryptKey, setActiveEmbeddingProvider } from '../../src/utils/config.js'
import {
  createProvider,
  clearProviderCache,
  getEmbeddingProvider,
  getProviderCapabilities,
  getProviderEmbeddingDimension,
  getProviderVectorCollectionName,
} from '../../src/ai/config.js'

const TEST_CONFIG_DIR = '/tmp/spectre-test-provider-capabilities'

describe('provider capabilities', () => {
  beforeEach(() => {
    process.env.SPECTRE_CONFIG_DIR = TEST_CONFIG_DIR
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    }
    clearProviderCache()
  })

  afterEach(() => {
    clearProviderCache()
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true })
    }
    delete process.env.SPECTRE_CONFIG_DIR
  })

  it('declares embedding support and dimensions per provider', () => {
    expect(getProviderCapabilities('openai').embeddings).toBe(true)
    expect(getProviderCapabilities('anthropic').embeddings).toBe(false)
    expect(getProviderEmbeddingDimension('openai')).toBe(1536)
    expect(getProviderEmbeddingDimension('gemini')).toBe(768)
    expect(getProviderEmbeddingDimension('ollama')).toBe(768)
    expect(() => getProviderEmbeddingDimension('anthropic')).toThrow(/does not support embeddings/)
  })

  it('uses a dedicated embedding provider when chat provider lacks embeddings', () => {
    addProvider({
      name: 'anthropic',
      apiKey: encryptKey('anthropic-key'),
      model: 'claude-sonnet-4-20250514',
      isActive: true,
    })
    addProvider({
      name: 'openai',
      apiKey: encryptKey('openai-key'),
      model: 'gpt-4o',
      isActive: false,
    })
    setActiveEmbeddingProvider('openai')

    const embeddingProvider = getEmbeddingProvider()

    expect(embeddingProvider.name).toBe('openai')
  })

  it('fails early when the selected provider cannot embed and no embedding provider is configured', () => {
    addProvider({
      name: 'anthropic',
      apiKey: encryptKey('anthropic-key'),
      model: 'claude-sonnet-4-20250514',
      isActive: true,
    })

    expect(() => getEmbeddingProvider()).toThrow(/does not support embeddings/)
  })

  it('creates dimension-specific vector collection names', () => {
    expect(getProviderVectorCollectionName('openai')).toBe('spectre_openai_1536')
    expect(getProviderVectorCollectionName('gemini')).toBe('spectre_gemini_768')
  })

  it('attaches capabilities to created provider instances', () => {
    const provider = createProvider({ name: 'anthropic', apiKey: 'test', model: 'claude-sonnet-4-20250514' })

    expect(provider.capabilities.embeddings).toBe(false)
    expect(provider.capabilities.streaming).toBe(true)
  })
})

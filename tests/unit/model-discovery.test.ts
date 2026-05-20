import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { discoverModels, clearModelCache, getFallbackModels } from '../../src/ai/model-discovery.js'

describe('Model Discovery', () => {
  beforeEach(() => {
    clearModelCache()
  })

  afterEach(() => {
    clearModelCache()
  })

  it('should return fallback models for OpenAI without API key', async () => {
    const result = await discoverModels('openai')
    expect(result.models.length).toBeGreaterThan(0)
    expect(result.source).toBe('fallback')
    expect(result.models[0].provider).toBe('openai')
    expect(result.models[0].id).toContain('gpt')
  })

  it('should return fallback models for Anthropic', async () => {
    const result = await discoverModels('anthropic')
    expect(result.models.length).toBeGreaterThan(0)
    expect(result.source).toBe('fallback')
    expect(result.models[0].provider).toBe('anthropic')
    expect(result.models[0].id).toContain('claude')
  })

  it('should return empty models for Ollama when not running', async () => {
    const result = await discoverModels('ollama', undefined, 'http://localhost:11434')
    expect(result.source).toBe('local')
    expect(result.error).toBeDefined()
  })

  it('should cache results', async () => {
    const result1 = await discoverModels('openai')
    const result2 = await discoverModels('openai')
    expect(result1.fetchedAt).toBe(result2.fetchedAt)
  })

  it('should return fallback models directly', () => {
    const openaiModels = getFallbackModels('openai')
    expect(openaiModels.length).toBeGreaterThan(0)
    expect(openaiModels[0].id).toContain('gpt')

    const anthropicModels = getFallbackModels('anthropic')
    expect(anthropicModels.length).toBeGreaterThan(0)
    expect(anthropicModels[0].id).toContain('claude')
  })
})

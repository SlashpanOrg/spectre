import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ModelValidator } from '../../src/ai/model-validator.js'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('ModelValidator', () => {
  let testDir: string
  let validator: ModelValidator

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-validator-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.env.HOME = testDir
    validator = new ModelValidator()
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should validate models and cache results', async () => {
    const results = await validator.validateModels(
      'openai',
      ['gpt-4o', 'gpt-4o-mini'],
      async () => ({ available: true }),
    )

    expect(results).toHaveLength(2)
    expect(results.every((r) => r.available)).toBe(true)
  })

  it('should filter known unavailable models', async () => {
    const results = await validator.validateModels(
      'gemini',
      ['gemini-2.5-pro', 'gemini-2.0-flash', 'deep-research-max-preview-04-2026'],
      async () => ({ available: true }),
    )

    const unavailable = results.filter((r) => !r.available)
    expect(unavailable.length).toBeGreaterThanOrEqual(1)
  })

  it('should cache validation results', async () => {
    await validator.validateModels(
      'openai',
      ['gpt-4o'],
      async () => ({ available: true }),
    )

    const available = validator.getAvailableModels('openai')
    expect(available).toContain('gpt-4o')
  })

  it('should mark model as unavailable', () => {
    validator.markModelUnavailable('gemini', 'gemini-2.0-flash', 'Deprecated')

    const status = validator.getModelStatus('gemini', 'gemini-2.0-flash')
    expect(status?.available).toBe(false)
    expect(status?.reason).toBe('Deprecated')
  })

  it('should clear cache', async () => {
    await validator.validateModels(
      'openai',
      ['gpt-4o'],
      async () => ({ available: true }),
    )

    validator.clearCache('openai')
    expect(validator.getAvailableModels('openai')).toHaveLength(0)
  })

  it('should validate single model', async () => {
    const result = await validator.validateSingleModel(
      'openai',
      'gpt-4o',
      async () => ({ available: true }),
    )

    expect(result.available).toBe(true)
    expect(result.id).toBe('gpt-4o')
  })

  it('should handle validation timeout', async () => {
    const result = await validator.validateSingleModel(
      'openai',
      'slow-model',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000))
        return { available: true }
      },
    )

    expect(result.available).toBe(false)
    expect(result.reason).toContain('timeout')
  }, 7000)
})

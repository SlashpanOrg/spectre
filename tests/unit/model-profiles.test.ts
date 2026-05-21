import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ModelProfileManager } from '../../src/ai/model-profiles.js'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('ModelProfileManager', () => {
  let testDir: string
  let manager: ModelProfileManager

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-profiles-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.env.HOME = testDir
    manager = new ModelProfileManager()
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should get built-in profile', () => {
    const profile = manager.getProfile('gpt-4o')

    expect(profile).not.toBeNull()
    expect(profile?.id).toBe('gpt-4o')
    expect(profile?.capabilities.streaming).toBe(true)
    expect(profile?.capabilities.toolCalling).toBe('native')
  })

  it('should create default profile for unknown model', () => {
    const profile = manager.getProfile('unknown-model-xyz')

    expect(profile).not.toBeNull()
    expect(profile?.id).toBe('unknown-model-xyz')
    expect(profile?.capabilities.toolCalling).toBe('text-based')
  })

  it('should update profile', () => {
    const updated = manager.updateProfile('gpt-4o', {
      capabilities: {
        maxOutputTokens: 32768,
      },
    })

    expect(updated.capabilities.maxOutputTokens).toBe(32768)
  })

  it('should get all profiles', () => {
    const profiles = manager.getAllProfiles()

    expect(profiles.length).toBeGreaterThanOrEqual(10)
    expect(profiles.some((p) => p.id === 'gpt-4o')).toBe(true)
    expect(profiles.some((p) => p.provider === 'anthropic')).toBe(true)
  })

  it('should get profiles for provider', () => {
    const openaiProfiles = manager.getProfilesForProvider('openai')

    expect(openaiProfiles.length).toBeGreaterThanOrEqual(5)
    expect(openaiProfiles.every((p) => p.provider === 'openai')).toBe(true)
  })

  it('should adapt system prompt for simple models', () => {
    const prompt = manager.getAdaptedSystemPrompt('gpt-3.5-turbo', 'Complex prompt with many instructions')

    expect(prompt).toContain('IMPORTANT: Be concise and direct')
  })

  it('should return tool calling capability', () => {
    expect(manager.shouldUseToolCalling('gpt-4o')).toBe(true)
    const unknownProfile = manager.createDefaultProfile('unknown-model')
    expect(unknownProfile.capabilities.toolCalling).toBe('text-based')
  })

  it('should return max response length', () => {
    const profile = manager.getProfile('gpt-4o')
    expect(profile?.capabilities.maxOutputTokens).toBeGreaterThan(0)
    expect(manager.getMaxResponseLength('unknown-model')).toBe(4096)
  })

  it('should return context window', () => {
    expect(manager.getContextWindow('gpt-4o')).toBe(128000)
    expect(manager.getContextWindow('claude-sonnet-4-20250514')).toBe(200000)
    expect(manager.getContextWindow('unknown-model')).toBe(128000)
  })

  it('should save and reload custom profile', () => {
    const customProfile = manager.createDefaultProfile('my-custom-model')
    customProfile.provider = 'custom'
    customProfile.capabilities.contextWindow = 64000

    manager.saveProfile(customProfile)

    const reloaded = manager.getProfile('my-custom-model')
    expect(reloaded?.provider).toBe('custom')
    expect(reloaded?.capabilities.contextWindow).toBe(64000)
  })

  it('should delete profile', () => {
    const customProfile = manager.createDefaultProfile('to-delete')
    manager.saveProfile(customProfile)

    const deleted = manager.deleteProfile('to-delete')
    expect(deleted).toBe(true)

    const reloaded = manager.getProfile('to-delete')
    expect(reloaded?.source).toBe('built-in')
  })
})

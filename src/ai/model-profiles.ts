import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger.js'

export interface ModelProfile {
  id: string
  provider: string
  capabilities: {
    streaming: boolean
    maxOutputTokens: number
    contextWindow: number
    toolCalling: 'native' | 'text-based' | 'none'
    reasoning: boolean
    vision: boolean
    functionCalling: boolean
  }
  communicationStyle: {
    systemPromptComplexity: 'simple' | 'medium' | 'complex'
    responseFormat: 'text' | 'structured' | 'xml' | 'json'
    requiresExplicitInstructions: boolean
    typicalResponseLength: 'short' | 'medium' | 'long'
  }
  lastUpdated: number
  source: 'built-in' | 'api' | 'user'
}

const PROFILES_DIR = join(process.env.HOME || '~', '.spectre', 'models')

const BUILTIN_PROFILES: ModelProfile[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    capabilities: {
      streaming: true,
      maxOutputTokens: 16384,
      contextWindow: 128000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    capabilities: {
      streaming: true,
      maxOutputTokens: 16384,
      contextWindow: 128000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'medium',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    capabilities: {
      streaming: true,
      maxOutputTokens: 4096,
      contextWindow: 128000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gpt-4',
    provider: 'openai',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 8192,
      toolCalling: 'native',
      reasoning: false,
      vision: false,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    capabilities: {
      streaming: true,
      maxOutputTokens: 4096,
      contextWindow: 16385,
      toolCalling: 'native',
      reasoning: false,
      vision: false,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'simple',
      responseFormat: 'text',
      requiresExplicitInstructions: true,
      typicalResponseLength: 'short',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 200000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'long',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'claude-haiku-4-20250514',
    provider: 'anthropic',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 200000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'medium',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'claude-opus-4-20250514',
    provider: 'anthropic',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 200000,
      toolCalling: 'native',
      reasoning: true,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'long',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    capabilities: {
      streaming: true,
      maxOutputTokens: 65536,
      contextWindow: 1000000,
      toolCalling: 'native',
      reasoning: true,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'long',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    capabilities: {
      streaming: true,
      maxOutputTokens: 65536,
      contextWindow: 1000000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'medium',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gemini-2.0-flash-lite',
    provider: 'gemini',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 1000000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'simple',
      responseFormat: 'text',
      requiresExplicitInstructions: true,
      typicalResponseLength: 'short',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 2000000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'complex',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'long',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
  {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    capabilities: {
      streaming: true,
      maxOutputTokens: 8192,
      contextWindow: 1000000,
      toolCalling: 'native',
      reasoning: false,
      vision: true,
      functionCalling: true,
    },
    communicationStyle: {
      systemPromptComplexity: 'medium',
      responseFormat: 'structured',
      requiresExplicitInstructions: false,
      typicalResponseLength: 'medium',
    },
    lastUpdated: Date.now(),
    source: 'built-in',
  },
]

export class ModelProfileManager {
  private profilesDir: string

  constructor() {
    this.profilesDir = PROFILES_DIR
    if (!existsSync(this.profilesDir)) {
      mkdirSync(this.profilesDir, { recursive: true, mode: 0o700 })
    }
    this.ensureBuiltinProfiles()
  }

  private ensureBuiltinProfiles(): void {
    for (const profile of BUILTIN_PROFILES) {
      const path = this.getProfilePath(profile.id)
      if (!existsSync(path)) {
        this.saveProfile(profile)
      }
    }
  }

  private getProfilePath(modelId: string): string {
    const safeId = modelId.replace(/[^a-zA-Z0-9-_.]/g, '_')
    return join(this.profilesDir, `${safeId}.json`)
  }

  getProfile(modelId: string): ModelProfile | null {
    const path = this.getProfilePath(modelId)
    if (existsSync(path)) {
      try {
        const data = readFileSync(path, 'utf-8')
        return JSON.parse(data) as ModelProfile
      } catch {
        return null
      }
    }

    const builtin = BUILTIN_PROFILES.find((p) => p.id === modelId)
    if (builtin) return builtin

    return this.createDefaultProfile(modelId)
  }

  createDefaultProfile(modelId: string): ModelProfile {
    return {
      id: modelId,
      provider: 'unknown',
      capabilities: {
        streaming: true,
        maxOutputTokens: 4096,
        contextWindow: 128000,
        toolCalling: 'text-based',
        reasoning: false,
        vision: false,
        functionCalling: false,
      },
      communicationStyle: {
        systemPromptComplexity: 'medium',
        responseFormat: 'text',
        requiresExplicitInstructions: true,
        typicalResponseLength: 'medium',
      },
      lastUpdated: Date.now(),
      source: 'built-in',
    }
  }

  saveProfile(profile: ModelProfile): void {
    const path = this.getProfilePath(profile.id)
    writeFileSync(path, JSON.stringify(profile, null, 2), { mode: 0o600 })
    logger.debug(`Saved model profile for ${profile.id}`)
  }

  updateProfile(modelId: string, updates: Partial<ModelProfile>): ModelProfile {
    const existing = this.getProfile(modelId)
    if (!existing) {
      const newProfile: ModelProfile = {
        ...this.createDefaultProfile(modelId),
        ...updates,
        id: modelId,
      }
      this.saveProfile(newProfile)
      return newProfile
    }

    const updated: ModelProfile = {
      ...existing,
      ...updates,
      capabilities: { ...existing.capabilities, ...(updates.capabilities || {}) },
      communicationStyle: {
        ...existing.communicationStyle,
        ...(updates.communicationStyle || {}),
      },
      lastUpdated: Date.now(),
    }
    this.saveProfile(updated)
    return updated
  }

  getAllProfiles(): ModelProfile[] {
    const profiles = [...BUILTIN_PROFILES]

    try {
      const files = readdirSync(this.profilesDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = readFileSync(join(this.profilesDir, file), 'utf-8')
            const profile = JSON.parse(data) as ModelProfile
            if (!profiles.find((p) => p.id === profile.id)) {
              profiles.push(profile)
            }
          } catch {
            continue
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return profiles
  }

  getProfilesForProvider(provider: string): ModelProfile[] {
    return this.getAllProfiles().filter((p) => p.provider === provider)
  }

  deleteProfile(modelId: string): boolean {
    const path = this.getProfilePath(modelId)
    if (existsSync(path)) {
      unlinkSync(path)
      logger.debug(`Deleted model profile for ${modelId}`)
      return true
    }
    return false
  }

  getAdaptedSystemPrompt(modelId: string, basePrompt: string): string {
    const profile = this.getProfile(modelId)
    if (!profile) return basePrompt

    const style = profile.communicationStyle

    if (style.requiresExplicitInstructions) {
      return `${basePrompt}\n\nIMPORTANT: Be concise and direct. Follow instructions exactly as given.`
    }

    if (style.systemPromptComplexity === 'simple') {
      const lines = basePrompt.split('\n').filter((l) => l.trim())
      return lines.slice(0, 10).join('\n')
    }

    return basePrompt
  }

  shouldUseToolCalling(modelId: string): boolean {
    const profile = this.getProfile(modelId)
    if (!profile) return false
    return profile.capabilities.toolCalling !== 'none'
  }

  getMaxResponseLength(modelId: string): number {
    const profile = this.getProfile(modelId)
    if (!profile) return 4096
    return profile.capabilities.maxOutputTokens
  }

  getContextWindow(modelId: string): number {
    const profile = this.getProfile(modelId)
    if (!profile) return 128000
    return profile.capabilities.contextWindow
  }
}

export const modelProfileManager = new ModelProfileManager()

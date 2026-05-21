import { logger } from '../utils/logger.js'
import { modelValidator } from './model-validator.js'

export interface ModelInfo {
  id: string
  provider: 'openai' | 'anthropic' | 'ollama' | 'gemini'
  created?: number
  ownedBy?: string
  isChatModel?: boolean
  isAvailable?: boolean
  availabilityReason?: string
}

export interface ModelDiscoveryResult {
  models: ModelInfo[]
  source: 'api' | 'fallback' | 'local' | 'validated'
  fetchedAt: number
  error?: string
}

const FALLBACK_MODELS: Record<string, ModelInfo[]> = {
  openai: [
    { id: 'gpt-4o', provider: 'openai', isChatModel: true },
    { id: 'gpt-4o-mini', provider: 'openai', isChatModel: true },
    { id: 'gpt-4-turbo', provider: 'openai', isChatModel: true },
    { id: 'gpt-4', provider: 'openai', isChatModel: true },
    { id: 'gpt-3.5-turbo', provider: 'openai', isChatModel: true },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', provider: 'anthropic', isChatModel: true },
    { id: 'claude-haiku-4-20250514', provider: 'anthropic', isChatModel: true },
    { id: 'claude-opus-4-20250514', provider: 'anthropic', isChatModel: true },
  ],
  ollama: [],
  gemini: [
    { id: 'gemini-2.5-pro', provider: 'gemini', isChatModel: true },
    { id: 'gemini-2.5-flash', provider: 'gemini', isChatModel: true },
    { id: 'gemini-2.0-flash-lite', provider: 'gemini', isChatModel: true },
    { id: 'gemini-1.5-pro', provider: 'gemini', isChatModel: true },
    { id: 'gemini-1.5-flash', provider: 'gemini', isChatModel: true },
  ],
}

const CACHE_TTL_MS = 5 * 60 * 1000

const modelCache = new Map<string, ModelDiscoveryResult>()

async function fetchOpenAIModels(apiKey: string): Promise<ModelDiscoveryResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      data: Array<{ id: string; created?: number; owned_by?: string }>
    }
    const models: ModelInfo[] = data.data
      .filter((m: { id: string }) => m.id.startsWith('gpt-'))
      .map((m: { id: string; created?: number; owned_by?: string }) => ({
        id: m.id,
        provider: 'openai' as const,
        created: m.created,
        ownedBy: m.owned_by,
        isChatModel: true,
      }))
      .sort((a: ModelInfo, b: ModelInfo) => (b.created || 0) - (a.created || 0))

    const result: ModelDiscoveryResult = {
      models,
      source: 'api',
      fetchedAt: Date.now(),
    }

    logger.info(`Fetched ${models.length} OpenAI models from API`)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn('Failed to fetch OpenAI models, using fallback:', message)
    return {
      models: FALLBACK_MODELS.openai,
      source: 'fallback',
      fetchedAt: Date.now(),
      error: message,
    }
  }
}

async function fetchOllamaModels(
  baseUrl: string = 'http://localhost:11434',
): Promise<ModelDiscoveryResult> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`)

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> }
    const models: ModelInfo[] = (data.models || []).map((m) => ({
      id: m.name,
      provider: 'ollama' as const,
      isChatModel: true,
    }))

    const result: ModelDiscoveryResult = {
      models,
      source: 'local',
      fetchedAt: Date.now(),
    }

    logger.info(`Found ${models.length} Ollama models locally`)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn('Failed to fetch Ollama models:', message)
    return {
      models: [],
      source: 'local',
      fetchedAt: Date.now(),
      error: 'Ollama not running. Start with: ollama serve',
    }
  }
}

function getAnthropicModels(): ModelDiscoveryResult {
  return {
    models: FALLBACK_MODELS.anthropic,
    source: 'fallback',
    fetchedAt: Date.now(),
  }
}

async function fetchGeminiModels(apiKey: string): Promise<ModelDiscoveryResult> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'x-goog-api-key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      models?: Array<{
        name: string
        displayName?: string
        version?: string
        inputTokenLimit?: number
        outputTokenLimit?: number
        supportedGenerationMethods?: string[]
      }>
    }

    const models: ModelInfo[] = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => ({
        id: m.name.replace('models/', ''),
        provider: 'gemini' as const,
        isChatModel: true,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))

    const result: ModelDiscoveryResult = {
      models,
      source: 'api',
      fetchedAt: Date.now(),
    }

    logger.info(`Fetched ${models.length} Gemini models from API`)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn('Failed to fetch Gemini models, using fallback:', message)
    return {
      models: FALLBACK_MODELS.gemini,
      source: 'fallback',
      fetchedAt: Date.now(),
      error: message,
    }
  }
}

export async function discoverModels(
  provider: 'openai' | 'anthropic' | 'ollama' | 'gemini',
  apiKey?: string,
  baseUrl?: string,
): Promise<ModelDiscoveryResult> {
  const cacheKey = `${provider}:${baseUrl || 'default'}`
  const cached = modelCache.get(cacheKey)

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    logger.debug('Returning cached model discovery result')
    return cached
  }

  let result: ModelDiscoveryResult

  switch (provider) {
    case 'openai':
      if (!apiKey) {
        result = { models: FALLBACK_MODELS.openai, source: 'fallback', fetchedAt: Date.now() }
      } else {
        result = await fetchOpenAIModels(apiKey)
      }
      break
    case 'anthropic':
      result = getAnthropicModels()
      break
    case 'ollama':
      result = await fetchOllamaModels(baseUrl)
      break
    case 'gemini':
      if (!apiKey) {
        result = { models: FALLBACK_MODELS.gemini, source: 'fallback', fetchedAt: Date.now() }
      } else {
        result = await fetchGeminiModels(apiKey)
      }
      break
    default:
      result = { models: [], source: 'fallback', fetchedAt: Date.now() }
  }

  modelCache.set(cacheKey, result)
  return result
}

export async function discoverValidatedModels(
  provider: 'openai' | 'anthropic' | 'ollama' | 'gemini',
  apiKey?: string,
  baseUrl?: string,
): Promise<ModelDiscoveryResult> {
  const discovery = await discoverModels(provider, apiKey, baseUrl)

  const modelIds = discovery.models.map((m) => m.id)
  const validationResults = await modelValidator.validateModels(
    provider,
    modelIds,
    async (_modelId) => {
      return {
        available: true,
        reason: undefined,
      }
    },
  )

  const validatedModels: ModelInfo[] = discovery.models.map((model) => {
    const validation = validationResults.find((r) => r.id === model.id)
    return {
      ...model,
      isAvailable: validation?.available ?? true,
      availabilityReason: validation?.reason,
    }
  }).filter((m) => m.isAvailable)

  return {
    models: validatedModels,
    source: 'validated',
    fetchedAt: Date.now(),
    error: discovery.error,
  }
}

export function markModelUnavailable(provider: string, modelId: string, reason: string): void {
  modelValidator.markModelUnavailable(provider, modelId, reason)
  modelCache.clear()
}

export function getAvailableModels(provider: string): string[] {
  return modelValidator.getAvailableModels(provider)
}

export function clearModelCache(): void {
  modelCache.clear()
  modelValidator.clearCache()
}

export function getFallbackModels(
  provider: 'openai' | 'anthropic' | 'ollama' | 'gemini',
): ModelInfo[] {
  return FALLBACK_MODELS[provider] || []
}

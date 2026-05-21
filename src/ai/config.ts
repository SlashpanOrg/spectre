import { AIProvider, ProviderCapabilities, ProviderConfig, ProviderName } from './provider.js'
import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { OllamaProvider } from './ollama.js'
import { GoogleGeminiProvider } from './gemini.js'
import { getActiveEmbeddingProvider, getActiveProvider, decryptKey } from '../utils/config.js'
import { logger } from '../utils/logger.js'

const PROVIDER_CAPABILITIES: Record<ProviderName, ProviderCapabilities> = {
  openai: {
    chat: true,
    streaming: true,
    embeddings: true,
    embeddingModel: 'text-embedding-3-small',
    embeddingDimension: 1536,
  },
  anthropic: {
    chat: true,
    streaming: true,
    embeddings: false,
  },
  ollama: {
    chat: true,
    streaming: true,
    embeddings: true,
    embeddingModel: 'nomic-embed-text',
    embeddingDimension: 768,
  },
  gemini: {
    chat: true,
    streaming: true,
    embeddings: true,
    embeddingModel: 'text-embedding-004',
    embeddingDimension: 768,
  },
}

let cachedProvider: AIProvider | null = null
let cachedEmbeddingProvider: AIProvider | null = null

export function getProviderCapabilities(name: ProviderName): ProviderCapabilities {
  return PROVIDER_CAPABILITIES[name]
}

export function getProviderEmbeddingDimension(name: ProviderName): number {
  const capabilities = getProviderCapabilities(name)
  if (!capabilities.embeddings || !capabilities.embeddingDimension) {
    throw new Error(`Provider ${name} does not support embeddings`)
  }
  return capabilities.embeddingDimension
}

export function getProviderVectorCollectionName(name: ProviderName): string {
  return `spectre_${name}_${getProviderEmbeddingDimension(name)}`
}

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.name) {
    case 'openai':
      if (!config.apiKey) throw new Error('OpenAI API key is required')
      return new OpenAIProvider(config.apiKey, config.model)
    case 'anthropic':
      if (!config.apiKey) throw new Error('Anthropic API key is required')
      return new AnthropicProvider(config.apiKey, config.model)
    case 'ollama':
      return new OllamaProvider(config.baseUrl, config.model)
    case 'gemini':
      if (!config.apiKey) throw new Error('Google Gemini API key is required')
      return new GoogleGeminiProvider(config.apiKey, config.model)
    default:
      throw new Error(`Unknown provider: ${(config as ProviderConfig).name}`)
  }
}

function createConfiguredProvider(active: ProviderConfig): AIProvider {
  const apiKey = active.apiKey ? decryptKey(active.apiKey) : undefined
  return createProvider({
    name: active.name,
    apiKey,
    baseUrl: active.baseUrl,
    model: active.model,
  })
}

export function getProvider(): AIProvider {
  if (cachedProvider) return cachedProvider

  const active = getActiveProvider()
  if (!active) {
    throw new Error('No active AI provider configured. Run /setup to configure one.')
  }

  cachedProvider = createConfiguredProvider(active)
  logger.info('AI provider initialized:', active.name, '-', active.model)
  return cachedProvider
}

export function getEmbeddingProvider(): AIProvider {
  if (cachedEmbeddingProvider) return cachedEmbeddingProvider

  const active = getActiveEmbeddingProvider()
  if (!active) {
    throw new Error(
      'No embedding provider configured. Run /setup to configure OpenAI, Gemini, or Ollama embeddings.',
    )
  }

  const capabilities = getProviderCapabilities(active.name)
  if (!capabilities.embeddings) {
    throw new Error(
      `Provider ${active.name} does not support embeddings. Configure activeEmbeddingProvider with OpenAI, Gemini, or Ollama.`,
    )
  }

  cachedEmbeddingProvider = createConfiguredProvider(active)
  logger.info('Embedding provider initialized:', active.name, '-', capabilities.embeddingModel)
  return cachedEmbeddingProvider
}

export function clearProviderCache(): void {
  cachedProvider = null
  cachedEmbeddingProvider = null
}

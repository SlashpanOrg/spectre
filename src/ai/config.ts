import { AIProvider, ProviderConfig } from './provider.js'
import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'
import { OllamaProvider } from './ollama.js'
import { getActiveProvider, decryptKey } from '../utils/config.js'
import { logger } from '../utils/logger.js'

let cachedProvider: AIProvider | null = null

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
    default:
      throw new Error(`Unknown provider: ${config.name}`)
  }
}

export function getProvider(): AIProvider {
  if (cachedProvider) return cachedProvider

  const active = getActiveProvider()
  if (!active) {
    throw new Error('No active AI provider configured. Run `spectre setup` to configure one.')
  }

  const apiKey = active.apiKey ? decryptKey(active.apiKey) : undefined
  const config: ProviderConfig = {
    name: active.name,
    apiKey,
    baseUrl: active.baseUrl,
    model: active.model,
  }

  cachedProvider = createProvider(config)
  logger.info('AI provider initialized:', active.name, '-', active.model)
  return cachedProvider
}

export function clearProviderCache(): void {
  cachedProvider = null
}

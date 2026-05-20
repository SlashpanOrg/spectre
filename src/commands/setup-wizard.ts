import readline from 'node:readline'
import { addProvider, setActiveProvider, encryptKey, Provider } from '../utils/config.js'
import { discoverModels, ModelInfo } from '../ai/model-discovery.js'
import { logger } from '../utils/logger.js'

interface ProviderOption {
  name: 'openai' | 'anthropic' | 'ollama' | 'gemini'
  label: string
  requiresApiKey: boolean
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { name: 'openai', label: 'OpenAI', requiresApiKey: true },
  { name: 'anthropic', label: 'Anthropic', requiresApiKey: true },
  { name: 'gemini', label: 'Google Gemini', requiresApiKey: true },
  { name: 'ollama', label: 'Ollama (Local LLM)', requiresApiKey: false },
]

export class SetupWizard {
  private rl: readline.Interface

  constructor(rl: readline.Interface) {
    this.rl = rl
  }

  async run(): Promise<string> {
    console.log('\n╔══════════════════════════════════════╗')
    console.log('║       Spectre Setup Wizard           ║')
    console.log('║   Configure your AI provider         ║')
    console.log('╚══════════════════════════════════════╝\n')

    const provider = await this.selectProvider()
    if (!provider) return 'Setup cancelled.'

    let apiKey = ''
    let baseUrl = ''
    if (provider.requiresApiKey) {
      apiKey = await this.getApiKey(provider.name)
      if (!apiKey) return 'Setup cancelled.'
    } else {
      baseUrl = await this.getOllamaUrl()
    }

    console.log('\nFetching available models...')
    const discovery = await discoverModels(provider.name, apiKey || undefined, baseUrl || undefined)

    if (discovery.error) {
      console.log(`⚠️  ${discovery.error}`)
    }

    if (discovery.models.length === 0) {
      if (provider.name === 'ollama') {
        console.log('No models found. Pull a model first: ollama pull llama3')
        return 'Setup cancelled.'
      }
      console.log('No models available. Using custom model entry.')
    }

    const model = await this.selectModel(provider.name, discovery.models, discovery.source)
    if (!model) return 'Setup cancelled.'

    const providerConfig: Provider = {
      name: provider.name,
      apiKey: apiKey ? encryptKey(apiKey) : undefined,
      baseUrl: baseUrl || undefined,
      model,
      isActive: true,
    }

    addProvider(providerConfig)
    setActiveProvider(provider.name)

    const sourceLabel =
      discovery.source === 'api'
        ? 'from API'
        : discovery.source === 'local'
          ? 'locally'
          : 'fallback list'
    logger.info(`Provider configured: ${provider.name} (${model}) - models ${sourceLabel}`)

    return `\n✅ Provider configured successfully!\n   Provider: ${provider.label}\n   Model: ${model}\n   Models: ${discovery.models.length} discovered (${discovery.source})\n\nYou can switch models anytime with /model\nType /help for available commands.`
  }

  private async selectProvider(): Promise<ProviderOption | null> {
    console.log('Select AI Provider:\n')
    PROVIDER_OPTIONS.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.label}${p.requiresApiKey ? '' : ' (no API key needed)'}`)
    })
    console.log()

    const answer = await this.prompt('Enter number (1-4) or name: ')
    const num = parseInt(answer, 10)

    if (num >= 1 && num <= PROVIDER_OPTIONS.length) {
      return PROVIDER_OPTIONS[num - 1]
    }

    const found = PROVIDER_OPTIONS.find(
      (p) => p.name === answer.toLowerCase() || p.label.toLowerCase() === answer.toLowerCase(),
    )
    if (found) return found

    console.log('Invalid selection. Setup cancelled.')
    return null
  }

  private async getApiKey(providerName: string): Promise<string> {
    console.log(`\nEnter your ${providerName} API key:`)
    console.log('(Your key is encrypted and stored locally)\n')

    const key = await this.prompt('API key: ')
    if (!key.trim()) {
      console.log('API key is required. Setup cancelled.')
      return ''
    }
    return key.trim()
  }

  private async getOllamaUrl(): Promise<string> {
    console.log('\nEnter Ollama URL:')
    const url = await this.prompt('URL (default: http://localhost:11434): ')
    return url.trim() || 'http://localhost:11434'
  }

  private async selectModel(
    _providerName: string,
    models: ModelInfo[],
    source: string,
  ): Promise<string | null> {
    if (models.length > 0) {
      console.log(`\nAvailable models (${models.length} discovered ${source}):\n`)
      models.slice(0, 15).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.id}`)
      })
      if (models.length > 15) {
        console.log(`  ... and ${models.length - 15} more`)
      }
      console.log(`  ${models.length + 1}. Custom model`)
      console.log()

      const answer = await this.prompt('Enter number or model name: ')
      const num = parseInt(answer, 10)

      if (num >= 1 && num <= models.length) {
        return models[num - 1].id
      }

      if (num === models.length + 1) {
        const custom = await this.prompt('Enter custom model name: ')
        return custom.trim() || undefined || null
      }

      const found = models.find((m) => m.id === answer)
      if (found) return found.id

      if (answer.trim()) return answer.trim()
    }

    const custom = await this.prompt('Enter model name: ')
    return custom.trim() || null
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer)
      })
    })
  }
}

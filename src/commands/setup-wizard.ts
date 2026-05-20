import readline from 'node:readline'
import { addProvider, setActiveProvider, encryptKey, Provider } from '../utils/config.js'
import { logger } from '../utils/logger.js'

interface ProviderOption {
  name: 'openai' | 'anthropic' | 'ollama'
  label: string
  defaultModel: string
  models: string[]
  requiresApiKey: boolean
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    name: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    requiresApiKey: true,
  },
  {
    name: 'anthropic',
    label: 'Anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514', 'claude-opus-4-20250514'],
    requiresApiKey: true,
  },
  {
    name: 'ollama',
    label: 'Ollama (Local LLM)',
    defaultModel: 'llama3',
    models: ['llama3', 'mistral', 'codellama', 'phi3'],
    requiresApiKey: false,
  },
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
    if (provider.requiresApiKey) {
      apiKey = await this.getApiKey(provider.name)
      if (!apiKey) return 'Setup cancelled.'
    }

    const model = await this.selectModel(provider)
    if (!model) return 'Setup cancelled.'

    const providerConfig: Provider = {
      name: provider.name,
      apiKey: apiKey ? encryptKey(apiKey) : undefined,
      model,
      isActive: true,
    }

    addProvider(providerConfig)
    setActiveProvider(provider.name)

    logger.info(`Provider configured: ${provider.name} (${model})`)

    return `\n✅ Provider configured successfully!\n   Provider: ${provider.label}\n   Model: ${model}\n\nYou can switch models anytime with /model\nType /help for available commands.`
  }

  private async selectProvider(): Promise<ProviderOption | null> {
    console.log('Select AI Provider:\n')
    PROVIDER_OPTIONS.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.label}${p.requiresApiKey ? '' : ' (no API key needed)'}`)
    })
    console.log()

    const answer = await this.prompt('Enter number (1-3) or name: ')
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

  private async selectModel(provider: ProviderOption): Promise<string | null> {
    console.log(`\nSelect ${provider.label} model:\n`)
    provider.models.forEach((m, i) => {
      const defaultMarker = m === provider.defaultModel ? ' (recommended)' : ''
      console.log(`  ${i + 1}. ${m}${defaultMarker}`)
    })
    console.log('  4. Custom model')
    console.log()

    const answer = await this.prompt('Enter number (1-4) or model name: ')
    const num = parseInt(answer, 10)

    if (num >= 1 && num <= provider.models.length) {
      return provider.models[num - 1]
    }

    if (num === 4) {
      const custom = await this.prompt('Enter custom model name: ')
      return custom.trim() || provider.defaultModel
    }

    const found = provider.models.find((m) => m === answer)
    if (found) return found

    return answer.trim() || provider.defaultModel
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer)
      })
    })
  }
}

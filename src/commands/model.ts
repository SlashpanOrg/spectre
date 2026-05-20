import { CommandHandler } from './parser.js'
import { getActiveProvider, setActiveProvider, loadConfig } from '../utils/config.js'

const AVAILABLE_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514', 'claude-opus-4-20250514'],
  ollama: ['llama3', 'mistral', 'codellama', 'phi3'],
}

export const modelCommand: CommandHandler = {
  name: 'model',
  description: 'View or switch AI model',
  execute: async (args: string) => {
    const config = loadConfig()
    const active = getActiveProvider()

    if (!active) {
      return 'No provider configured. Use /setup to configure one.'
    }

    if (!args) {
      const models = AVAILABLE_MODELS[active.name] || [active.model]
      const modelList = models
        .map((m) => (m === active.model ? `  ● ${m} (active)` : `  ○ ${m}`))
        .join('\n')
      return `Current provider: ${active.name}\nCurrent model: ${active.model}\n\nAvailable models:\n${modelList}\n\nSwitch with: /model <name>`
    }

    const targetModel = args.trim()

    const available = AVAILABLE_MODELS[active.name] || []
    if (available.length > 0 && !available.includes(targetModel)) {
      return `Model "${targetModel}" not available for ${active.name}.\nAvailable: ${available.join(', ')}\n\nOr use a custom model with /setup.`
    }

    const provider = config.providers.find((p) => p.name === active.name)
    if (!provider) {
      return 'Provider not found in config. Use /setup to reconfigure.'
    }

    provider.model = targetModel
    config.providers = config.providers.map((p) => (p.name === active.name ? provider : p))

    import('../utils/config.js').then(({ saveConfig }) => saveConfig(config))
    setActiveProvider(active.name)

    return `Switched to ${active.name} (${targetModel})`
  },
}

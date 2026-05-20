import { CommandHandler } from './parser.js'
import { getActiveProvider, setActiveProvider, loadConfig, decryptKey } from '../utils/config.js'
import { discoverModels } from '../ai/model-discovery.js'

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
      const apiKey = active.apiKey ? decryptKey(active.apiKey) : undefined
      const discovery = await discoverModels(active.name, apiKey, active.baseUrl)

      const sourceLabel =
        discovery.source === 'api'
          ? ' (from API)'
          : discovery.source === 'local'
            ? ' (local)'
            : ' (fallback)'
      const modelList = discovery.models
        .slice(0, 10)
        .map((m) => (m.id === active.model ? `  ● ${m.id} (active)` : `  ○ ${m.id}`))
        .join('\n')
      const moreText =
        discovery.models.length > 10 ? `\n  ... and ${discovery.models.length - 10} more` : ''

      return `Current provider: ${active.name}\nCurrent model: ${active.model}\n\nAvailable models${sourceLabel}:\n${modelList}${moreText}\n\nSwitch with: /model <name>`
    }

    const targetModel = args.trim()

    const provider = config.providers.find((p) => p.name === active.name)
    if (!provider) {
      return 'Provider not found in config. Use /setup to reconfigure.'
    }

    provider.model = targetModel
    config.providers = config.providers.map((p) => (p.name === active.name ? provider : p))

    const { saveConfig } = await import('../utils/config.js')
    saveConfig(config)
    setActiveProvider(active.name)

    return `Switched to ${active.name} (${targetModel})`
  },
}

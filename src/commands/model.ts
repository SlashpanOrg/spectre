import { CommandHandler } from './parser.js'
import { getActiveProvider, setActiveProvider, loadConfig } from '../utils/config.js'

export const modelCommand: CommandHandler = {
  name: 'model',
  description: 'View or switch AI model',
  execute: async (args: string) => {
    const active = getActiveProvider()
    if (!active) {
      return 'No provider configured. Use /setup to configure one.'
    }

    if (args) {
      const config = loadConfig()
      const provider = config.providers.find((p) => p.name === args || p.model === args)
      if (!provider) {
        return `Provider "${args}" not found. Available: ${config.providers.map((p) => p.name).join(', ') || 'none'}`
      }
      setActiveProvider(provider.name)
      return `Switched to ${provider.name} (${provider.model})`
    }

    return `Current provider: ${active.name}\nModel: ${active.model}\n\nAvailable: ${
      loadConfig()
        .providers.map((p) => `${p.name} (${p.model})`)
        .join('\n') || 'None configured. Use /setup.'
    }`
  },
}

import { CommandHandler } from './parser.js'

export const statusCommand: CommandHandler = {
  name: 'status',
  description: 'Show session status',
  execute: async () => {
    return `Session: active\nProvider: not configured\nIndexed repos: 0\nUse /setup to configure your AI provider.`
  },
}

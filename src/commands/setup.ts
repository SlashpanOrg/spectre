import { CommandHandler } from './parser.js'

export const setupCommand: CommandHandler = {
  name: 'setup',
  description: 'Configure API keys and AI providers',
  execute: async () => '__WIZARD__',
}

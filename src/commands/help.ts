import { CommandHandler } from './parser.js'
import { HELP_MESSAGE } from '../utils/branding.js'

export const helpCommand: CommandHandler = {
  name: 'help',
  description: 'Show available commands',
  execute: async () => HELP_MESSAGE,
}

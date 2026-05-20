import { CommandHandler } from './parser.js'

export const quitCommand: CommandHandler = {
  name: 'quit',
  description: 'Exit the session',
  execute: async () => '__QUIT__',
}

export const exitCommand: CommandHandler = {
  name: 'exit',
  description: 'Exit the session',
  execute: async () => '__QUIT__',
}

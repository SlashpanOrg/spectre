import { CommandHandler } from './parser.js'

export const indexCommand: CommandHandler = {
  name: 'index',
  description: 'Index a Git repository',
  execute: async () => 'Indexing coming soon. Connect a Git repository to get started.',
}

export const queryCommand: CommandHandler = {
  name: 'query',
  description: 'Ask a question about your codebase',
  execute: async () => 'Query engine coming soon. Index a repository first with /index.',
}

export const reviewCommand: CommandHandler = {
  name: 'review',
  description: 'Review a pull request',
  execute: async () => 'PR review coming soon.',
}

export const debtCommand: CommandHandler = {
  name: 'debt',
  description: 'Analyze technical debt',
  execute: async () => 'Tech debt analysis coming soon.',
}

export const docsCommand: CommandHandler = {
  name: 'docs',
  description: 'Generate documentation',
  execute: async () => 'Documentation generation coming soon.',
}

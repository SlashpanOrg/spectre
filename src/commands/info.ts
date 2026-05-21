import { CommandHandler } from './parser.js'
import { getProviderCapabilities, getProviderVectorCollectionName } from '../ai/config.js'
import { ProviderName } from '../ai/provider.js'
import { loadConfig } from '../utils/config.js'
import { MetadataStore } from '../storage/metadata-store.js'

export const providersCommand: CommandHandler = {
  name: 'providers',
  description: 'List configured providers and capabilities',
  execute: async () => {
    const config = loadConfig()
    if (config.providers.length === 0) {
      return 'No providers configured. Run /setup to add one.'
    }

    return [
      'Configured providers:',
      ...config.providers.map((provider) => {
        const name = provider.name as ProviderName
        const capabilities = getProviderCapabilities(name)
        const roles = [
          provider.name === config.activeProvider ? 'chat' : undefined,
          provider.name === config.activeEmbeddingProvider ? 'embedding' : undefined,
        ]
          .filter(Boolean)
          .join(', ')
        const embeddingText = capabilities.embeddings
          ? `embeddings ${capabilities.embeddingDimension}d (${getProviderVectorCollectionName(name)})`
          : 'no embeddings'
        return `  ${provider.name} ${provider.model}${roles ? ` [${roles}]` : ''} — ${embeddingText}`
      }),
    ].join('\n')
  },
}

export const historyCommand: CommandHandler = {
  name: 'history',
  description: 'Show recent query history',
  execute: async (args?: string) => {
    const limit = Number.parseInt(args || '10', 10)
    const store = new MetadataStore()
    try {
      const history = store.getQueryHistory(Number.isFinite(limit) ? limit : 10)
      if (history.length === 0) return 'No query history yet.'
      return [
        'Recent queries:',
        ...history.map(
          (item) => `  ${item.timestamp}  ${item.query} (${item.evidenceCount} evidence items)`,
        ),
      ].join('\n')
    } finally {
      store.close()
    }
  },
}

export const reposCommand: CommandHandler = {
  name: 'repos',
  description: 'List indexed repositories',
  execute: async () => {
    const store = new MetadataStore()
    try {
      const repos = store.getAllRepos()
      if (repos.length === 0) return 'No indexed repositories yet. Run /index first.'
      return [
        'Indexed repositories:',
        ...repos.map(
          (repo) =>
            `  ${repo.path} [${repo.branch}] ${repo.commitCount} commits, last ${repo.indexedCommitHash?.substring(0, 7) || 'unknown'} at ${repo.lastIndexedAt}`,
        ),
      ].join('\n')
    } finally {
      store.close()
    }
  },
}

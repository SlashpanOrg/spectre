import { CommandHandler } from './parser.js'
import { getActiveProvider, loadConfig } from '../utils/config.js'

export const statusCommand: CommandHandler = {
  name: 'status',
  description: 'Show session status',
  execute: async () => {
    const active = getActiveProvider()
    const config = loadConfig()

    const providerStatus = active
      ? `Provider: ${active.name}\nModel: ${active.model}\nAPI Key: ${active.apiKey ? 'configured' : 'not set (local)'}`
      : 'Provider: not configured (use /setup)'

    const allProviders = config.providers.map(
      (p) => `  - ${p.name} (${p.model})${p.isActive ? ' [active]' : ''}`,
    )
    const providerList = allProviders.length > 0 ? allProviders.join('\n') : '  None configured'

    const indexedRepos =
      config.indexedRepos.length > 0 ? config.indexedRepos.join('\n  - ') : 'None'

    return `Session Status
══════════════

${providerStatus}

Configured Providers:
${providerList}

Indexed Repositories:
  - ${indexedRepos}

Last Indexed: ${config.lastIndexedAt || 'Never'}

Commands:
  /setup    - Configure a new provider
  /model    - Switch active model
  /index    - Index a Git repository`
  },
}

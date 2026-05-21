import { getProvider, clearProviderCache } from '../ai/config.js'
import { AgentOrchestrator } from '../agent/orchestrator.js'
import { ToolRegistry } from '../agent/tools/registry.js'
import { logger } from '../utils/logger.js'

export const agentCommand = {
  name: 'agent',
  description: 'Run a coding agent task (uses tools to complete your request)',
  usage: '/agent <description>',
  execute: async (args?: string): Promise<string> => {
    try {
      clearProviderCache()
      const provider = getProvider()

      if (!args) {
        return 'Usage: /agent <description>\nExample: /agent read src/index.ts and explain the architecture'
      }

      const toolRegistry = new ToolRegistry()
      const orchestrator = new AgentOrchestrator(provider, toolRegistry)
      await orchestrator.initialize()

      const response = await orchestrator.processMessage(args)

      return response
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Agent command failed:', msg)
      return `Agent failed: ${msg}`
    }
  },
}

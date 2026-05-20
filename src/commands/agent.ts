import { getProvider, clearProviderCache } from '../ai/config.js'
import { AgentOrchestrator, AgentTask } from '../agent/orchestrator.js'
import { logger } from '../utils/logger.js'

export const agentCommand = {
  name: 'agent',
  description: 'Run a multi-step agent task (auto-plans and executes tools)',
  usage: '/agent <description>',
  execute: async (args?: string): Promise<string> => {
    try {
      clearProviderCache()
      const provider = getProvider()

      if (!args) {
        return 'Usage: /agent <description>\nExample: /agent index this repo and analyze tech debt'
      }

      const orchestrator = new AgentOrchestrator(provider)

      console.log('Planning...')

      const task = await orchestrator.execute(args, (task: AgentTask) => {
        const running = task.steps.findIndex((s) => s.status === 'running')
        const currentStep = task.steps[running]
        if (currentStep) {
          process.stdout.write(
            `\r  Step ${running + 1}/${task.steps.length}: ${currentStep.description} [${currentStep.status}]`,
          )
        }
      })

      console.log()

      let output = `Agent Task: ${task.status}\n`
      output += `Steps: ${task.steps.filter((s) => s.status === 'completed').length}/${task.steps.length} completed\n\n`

      for (const step of task.steps) {
        const icon = step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '○'
        output += `${icon} ${step.description} (${step.tool})\n`
        if (step.error) output += `   Error: ${step.error}\n`
      }

      if (task.result) {
        output += `\n${task.result}`
      }

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Agent command failed:', msg)
      return `Agent failed: ${msg}`
    }
  },
}

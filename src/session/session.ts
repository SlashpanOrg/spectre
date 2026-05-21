import readline from 'node:readline'
import { CommandParser } from '../commands/parser.js'
import { WELCOME_MESSAGE } from '../utils/branding.js'
import { SetupWizard } from '../commands/setup-wizard.js'
import { getActiveProvider } from '../utils/config.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { AgentOrchestrator, AgentTask } from '../agent/orchestrator.js'
import { logger } from '../utils/logger.js'

export interface SessionState {
  isRunning: boolean
  commandHistory: string[]
  historyIndex: number
  currentProvider: string
  currentModel: string
}

export class Session {
  private rl: readline.Interface
  private parser: CommandParser
  private state: SessionState
  private agent: AgentOrchestrator | null = null

  constructor(parser: CommandParser) {
    this.parser = parser
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    })
    this.state = {
      isRunning: false,
      commandHistory: [],
      historyIndex: -1,
      currentProvider: 'none',
      currentModel: 'none',
    }

    this.setupInputHandling()
  }

  private setupInputHandling(): void {
    this.rl.on('SIGINT', () => {
      console.log('\nOperation interrupted. Type /quit to exit.')
      this.prompt()
    })

    this.rl.on('SIGTSTP', () => {
      this.rl.close()
    })
  }

  async start(): Promise<void> {
    this.state.isRunning = true
    this.updateProviderStatus()

    console.log(WELCOME_MESSAGE)
    console.log('Type /help for available commands or just ask a question.\n')

    this.prompt()

    for await (const line of this.readLines()) {
      if (!this.state.isRunning) break

      const trimmed = line.trim()
      if (!trimmed) {
        this.prompt()
        continue
      }

      if (trimmed === '/quit' || trimmed === '/exit') {
        console.log('\nGoodbye!')
        this.state.isRunning = false
        break
      }

      this.state.commandHistory.push(trimmed)
      this.state.historyIndex = -1

      const result = await this.parser.execute(trimmed)
      if (result) {
        if (result === '__QUIT__') {
          console.log('\nGoodbye!')
          this.state.isRunning = false
          break
        }

        if (result === '__WIZARD__') {
          const wizard = new SetupWizard(this.rl)
          const wizardResult = await wizard.run()
          console.log(`\n${wizardResult}\n`)
          this.updateProviderStatus()
          this.prompt()
          continue
        }

        console.log(`\n${result}\n`)
      } else {
        // Natural language query - use agent
        await this.handleNaturalLanguage(trimmed)
      }

      this.prompt()
    }

    this.rl.close()
    process.exit(0)
  }

  private prompt(): void {
    const providerTag =
      this.state.currentProvider !== 'none'
        ? ` [${this.state.currentProvider}:${this.state.currentModel}]`
        : ''
    process.stdout.write(`\r> `)
    if (providerTag) {
      process.stdout.write('')
    }
  }

  private async *readLines(): AsyncIterable<string> {
    for await (const line of this.rl) {
      yield line
    }
  }

  private updateProviderStatus(): void {
    const active = getActiveProvider()
    if (active) {
      this.state.currentProvider = active.name
      this.state.currentModel = active.model
    } else {
      this.state.currentProvider = 'none'
      this.state.currentModel = 'none'
    }
  }

  private async handleNaturalLanguage(input: string): Promise<void> {
    try {
      clearProviderCache()
      const provider = getProvider()

      if (!this.agent) {
        this.agent = new AgentOrchestrator(provider)
      }

      console.log('\n🤖 Planning...')

      const task = await this.agent.execute(input, (task: AgentTask) => {
        // Show progress
        const running = task.steps.findIndex((s) => s.status === 'running')
        const currentStep = task.steps[running]

        if (currentStep) {
          process.stdout.write(
            `\r  Step ${running + 1}/${task.steps.length}: ${currentStep.description} [${currentStep.status}]`,
          )
        }
      })

      console.log()

      if (task.status === 'interrupted') {
        console.log('\nTask interrupted by user.')
      } else if (task.status === 'failed') {
        const failedStep = task.steps.find((s) => s.status === 'failed')
        console.log(`\nTask failed: ${failedStep?.error || 'Unknown error'}`)
      } else {
        console.log(`\n${task.result || 'Task completed.'}`)
        for (const step of task.steps) {
          if (step.result) {
            console.log(`  ✓ ${step.description}`)
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Agent execution failed:', msg)
      console.log(`\nAgent failed: ${msg}`)
    }
  }

  getState(): SessionState {
    return { ...this.state }
  }
}

import readline from 'node:readline'
import { CommandParser } from '../commands/parser.js'
import { WELCOME_MESSAGE } from '../utils/branding.js'

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
      this.rl.prompt()
    })

    this.rl.on('SIGTSTP', () => {
      this.rl.close()
    })
  }

  async start(): Promise<void> {
    this.state.isRunning = true

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
        console.log(`\n${result}\n`)
      } else {
        console.log('\nNatural language queries coming soon. Use /help for available commands.\n')
      }

      this.prompt()
    }

    this.rl.close()
    process.exit(0)
  }

  private prompt(): void {
    this.rl.write('\r> ')
  }

  private async *readLines(): AsyncIterable<string> {
    for await (const line of this.rl) {
      yield line
    }
  }

  getState(): SessionState {
    return { ...this.state }
  }

  updateProvider(provider: string, model: string): void {
    this.state.currentProvider = provider
    this.state.currentModel = model
  }
}

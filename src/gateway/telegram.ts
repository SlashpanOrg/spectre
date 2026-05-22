import { AgentOrchestrator } from '../agent/orchestrator.js'
import { ToolRegistry } from '../agent/tools/registry.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { logger } from '../utils/logger.js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface TelegramUpdate {
  update_id: number
  message?: {
    chat: { id: number }
    text?: string
  }
}

interface TelegramResponse<T> {
  ok: boolean
  result: T
  description?: string
}

export class TelegramGateway {
  private token: string
  private running = false
  private offset = 0
  private stateDir: string
  private initFlagFile: string
  private offsetFile: string
  private lockFile: string
  private firstUserInteraction = true

  constructor(token: string) {
    this.token = token
    this.stateDir = join(process.env.HOME || '~', '.spectre', 'gateway')
    this.initFlagFile = join(this.stateDir, 'gateway_initialized')
    this.offsetFile = join(this.stateDir, 'gateway.offset')
    this.lockFile = join(this.stateDir, 'gateway.lock')
    this.offset = this.loadOffset()
  }

  private loadOffset(): number {
    if (!existsSync(this.offsetFile)) return 0
    try {
      const raw = readFileSync(this.offsetFile, 'utf-8').trim()
      const parsed = Number(raw)
      return Number.isInteger(parsed) ? parsed : 0
    } catch {
      return 0
    }
  }

  private saveOffset(): void {
    writeFileSync(this.offsetFile, String(this.offset), { mode: 0o600 })
  }

  private isFirstConnection(): boolean {
    return !existsSync(this.initFlagFile)
  }

  private markAsConnected(): void {
    writeFileSync(this.initFlagFile, Date.now().toString(), { mode: 0o600 })
  }

  async start(): Promise<void> {
    // Prevent duplicate gateway instance
    if (existsSync(this.lockFile)) {
      const existingPid = readFileSync(this.lockFile, 'utf-8').trim()
      const gatewayPid = process.env.SPECTRE_GATEWAY_PID_FILE
      const expectedPid = gatewayPid ? readFileSync(gatewayPid, 'utf-8').trim() : ''
      if (existingPid && existingPid !== expectedPid) {
        logger.warn(`Duplicate gateway instance detected (lock held by PID ${existingPid}), shutting down.`)
        return
      }
    }
    writeFileSync(this.lockFile, String(process.pid), { mode: 0o600 })

    const isFirstTime = this.isFirstConnection()
    if (isFirstTime) {
      logger.info('Telegram gateway connected for the first time')
      this.markAsConnected()
      this.firstUserInteraction = true
    } else {
      this.firstUserInteraction = false
    }

    this.running = true
    logger.info('Telegram gateway started')

    while (this.running) {
      try {
        const updates = await this.getUpdates()
        for (const update of updates) {
          this.offset = update.update_id + 1
          this.saveOffset()
          await this.handleUpdate(update)
        }
      } catch (error) {
        logger.warn(`Telegram gateway polling failed: ${error instanceof Error ? error.message : String(error)}`)
        await this.sleep(3000)
      }
    }
  }

  stop(): void {
    this.running = false
    if (existsSync(this.lockFile)) {
      try {
        const lockPid = readFileSync(this.lockFile, 'utf-8').trim()
        if (lockPid === String(process.pid)) {
          writeFileSync(this.lockFile, '', { mode: 0o600 })
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private async getUpdates(): Promise<TelegramUpdate[]> {
    const url = `https://api.telegram.org/bot${this.token}/getUpdates?timeout=30&offset=${this.offset}`
    const response = await fetch(url)
    const data = (await response.json()) as TelegramResponse<TelegramUpdate[]>

    if (!data.ok) {
      throw new Error(data.description || 'Telegram getUpdates failed')
    }

    return data.result
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message
    if (!message?.text) return

    const chatId = message.chat.id
    const text = message.text.trim()

    if (text === '/start') {
      if (this.firstUserInteraction) {
        this.firstUserInteraction = false
        await this.sendMessage(
          chatId,
          '✨ **Spectre Gateway Online** ✨\n\nWelcome! The Spectre AI Development Intelligence Agent gateway is now connected to Telegram.\n\nYou can now:\n• Send tasks and questions\n• Get code analysis and suggestions\n• Execute development workflows\n• Manage agent operations\n\nJust send your task or question, and Spectre will handle it!\n\nType /help for available commands.',
        )
      } else {
        await this.sendMessage(chatId, 'Spectre gateway is online. Send a task or question.')
      }
      return
    }

    await this.sendMessage(chatId, 'Spectre is thinking...')

    try {
      clearProviderCache()
      const orchestrator = new AgentOrchestrator(getProvider(), new ToolRegistry())
      await orchestrator.initialize()
      const response = await orchestrator.processMessage(text)
      await this.sendMessage(chatId, this.truncate(response || '(no response)'))
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error)
      logger.error('Telegram agent execution failed:', messageText)
      await this.sendMessage(chatId, `Spectre failed: ${messageText}`)
    }
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    const data = (await response.json()) as TelegramResponse<unknown>
    if (!data.ok) {
      throw new Error(data.description || 'Telegram sendMessage failed')
    }
  }

  private truncate(text: string): string {
    return text.length > 3900 ? `${text.slice(0, 3900)}\n\n...truncated` : text
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

#!/usr/bin/env node
import { TelegramGateway } from './telegram.js'
import { logger } from '../utils/logger.js'

const token = process.env.SPECTRE_TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('SPECTRE_TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

let running = true
let intentionalStop = false

process.on('SIGTERM', () => {
  intentionalStop = true
  running = false
  process.exit(0)
})

process.on('SIGINT', () => {
  intentionalStop = true
  running = false
  process.exit(0)
})

async function runGateway(): Promise<void> {
  while (running) {
    const gateway = new TelegramGateway(token!)

    try {
      await gateway.start()
    } catch (error) {
      if (!intentionalStop) {
        logger.error('Gateway crashed:', error instanceof Error ? error.message : String(error))
        logger.info('Restarting gateway in 5 seconds...')
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
  }
}

runGateway().catch((error) => {
  if (!intentionalStop) {
    logger.error('Gateway process error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
})

#!/usr/bin/env node
import { TelegramGateway } from './telegram.js'
import { logger } from '../utils/logger.js'

const token = process.env.SPECTRE_TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('SPECTRE_TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

const gateway = new TelegramGateway(token)

process.on('SIGTERM', () => {
  gateway.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  gateway.stop()
  process.exit(0)
})

gateway.start().catch((error) => {
  logger.error('Gateway crashed:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})

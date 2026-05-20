import fs from 'node:fs'
import path from 'node:path'
import CryptoJS from 'crypto-js'
import { z } from 'zod'
import { logger } from './logger.js'

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.spectre')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const ENCRYPTION_KEY = 'spectre-local-key-2026'

export const ProviderSchema = z.object({
  name: z.enum(['openai', 'anthropic', 'ollama']),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string(),
  isActive: z.boolean().default(false),
})

export type Provider = z.infer<typeof ProviderSchema>

export const ConfigSchema = z.object({
  version: z.string().default('0.1.0'),
  providers: z.array(ProviderSchema).default([]),
  activeProvider: z.string().default('openai'),
  qdrantUrl: z.string().default('http://localhost:6333'),
  dbPath: z.string().default(path.join(CONFIG_DIR, 'spectre.db')),
  lastIndexedAt: z.string().optional(),
  indexedRepos: z.array(z.string()).default([]),
})

export type Config = z.infer<typeof ConfigSchema>

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function encryptKey(key: string): string {
  return CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString()
}

function decryptKey(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function loadConfig(): Config {
  ensureConfigDir()
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig: Config = ConfigSchema.parse({})
    saveConfig(defaultConfig)
    return defaultConfig
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return ConfigSchema.parse(parsed)
  } catch (error) {
    logger.error('Failed to load config, using defaults:', error)
    return ConfigSchema.parse({})
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
  logger.debug('Config saved to', CONFIG_FILE)
}

export function getActiveProvider(): Provider | undefined {
  const config = loadConfig()
  return config.providers.find((p) => p.name === config.activeProvider && p.isActive)
}

export function setActiveProvider(name: string): void {
  const config = loadConfig()
  config.providers.forEach((p) => {
    p.isActive = p.name === name
  })
  config.activeProvider = name
  saveConfig(config)
}

export function addProvider(provider: Provider): void {
  const config = loadConfig()
  const existing = config.providers.findIndex((p) => p.name === provider.name)
  if (existing >= 0) {
    config.providers[existing] = provider
  } else {
    config.providers.push(provider)
  }
  saveConfig(config)
}

export function removeProvider(name: string): void {
  const config = loadConfig()
  config.providers = config.providers.filter((p) => p.name !== name)
  saveConfig(config)
}

export { encryptKey, decryptKey, CONFIG_DIR, CONFIG_FILE }

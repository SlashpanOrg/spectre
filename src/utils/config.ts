import fs from 'node:fs'
import path from 'node:path'
import CryptoJS from 'crypto-js'
import { z } from 'zod'
import { logger } from './logger.js'

const LEGACY_ENCRYPTION_KEY = 'spectre-local-key-2026'

function getEncryptionKey(): string {
  if (process.env.SPECTRE_CONFIG_SECRET) {
    return process.env.SPECTRE_CONFIG_SECRET
  }

  const home = process.env.HOME || process.env.USERPROFILE || 'unknown-home'
  return CryptoJS.SHA256(`spectre:${home}:${getConfigDir()}`).toString(CryptoJS.enc.Hex)
}

function getConfigDir(): string {
  return (
    process.env.SPECTRE_CONFIG_DIR ||
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.spectre')
  )
}

function getConfigFile(): string {
  return path.join(getConfigDir(), 'config.json')
}

function ensureConfigDir(): void {
  const dir = getConfigDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  } else {
    fs.chmodSync(dir, 0o700)
  }
}

export function getRepoStateDir(): string {
  return path.join(getConfigDir(), 'repo-state')
}

export function getRepoStateFile(repoPath: string, branch: string = 'default'): string {
  const normalizedPath = path.resolve(repoPath)
  const safeId = CryptoJS.SHA256(`${normalizedPath}:${branch}`).toString(CryptoJS.enc.Hex)
  return path.join(getRepoStateDir(), `${safeId}.json`)
}

export const ProviderSchema = z.object({
  name: z.enum(['openai', 'anthropic', 'ollama', 'gemini']),
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
  activeEmbeddingProvider: z.string().optional(),
  qdrantUrl: z.string().default(process.env.SPECTRE_QDRANT_URL || 'http://localhost:6333'),
  dbPath: z.string().default(path.join(getConfigDir(), 'spectre.db')),
  lastIndexedAt: z.string().optional(),
  indexedRepos: z.array(z.string()).default([]),
})

export type Config = z.infer<typeof ConfigSchema>

export function encryptKey(key: string): string {
  return CryptoJS.AES.encrypt(key, getEncryptionKey()).toString()
}

function tryDecryptKey(encrypted: string, secret: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, secret)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}

export function decryptKey(encrypted: string): string {
  const activeResult = tryDecryptKey(encrypted, getEncryptionKey())
  if (activeResult) {
    return activeResult
  }

  return tryDecryptKey(encrypted, LEGACY_ENCRYPTION_KEY)
}

export function loadConfig(): Config {
  ensureConfigDir()
  const configFile = getConfigFile()
  if (!fs.existsSync(configFile)) {
    const defaultConfig: Config = ConfigSchema.parse({})
    if (process.env.SPECTRE_QDRANT_URL) {
      defaultConfig.qdrantUrl = process.env.SPECTRE_QDRANT_URL
    }
    saveConfig(defaultConfig)
    return defaultConfig
  }
  try {
    const raw = fs.readFileSync(configFile, 'utf-8')
    const parsed = JSON.parse(raw)
    return ConfigSchema.parse(parsed)
  } catch (error) {
    logger.error('Failed to load config, using defaults:', error)
    return ConfigSchema.parse({})
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir()
  const configFile = getConfigFile()
  const tempFile = `${configFile}.tmp-${process.pid}`
  fs.writeFileSync(tempFile, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 })
  fs.renameSync(tempFile, configFile)
  fs.chmodSync(configFile, 0o600)
  logger.debug('Config saved to', configFile)
}

export function updateActiveProviderModel(model: string): Provider {
  const config = loadConfig()
  const active = config.providers.find((p) => p.name === config.activeProvider && p.isActive)
  if (!active) {
    throw new Error('No active provider configured')
  }
  active.model = model
  saveConfig(config)
  return active
}

export function getActiveProvider(): Provider | undefined {
  const config = loadConfig()
  return config.providers.find((p) => p.name === config.activeProvider && p.isActive)
}

export function getActiveEmbeddingProvider(): Provider | undefined {
  const config = loadConfig()
  const embeddingProviderName = config.activeEmbeddingProvider || config.activeProvider
  return config.providers.find((p) => p.name === embeddingProviderName)
}

export function setActiveProvider(name: string): void {
  const config = loadConfig()
  config.providers.forEach((p) => {
    p.isActive = p.name === name
  })
  config.activeProvider = name
  saveConfig(config)
}

export function setActiveEmbeddingProvider(name: string): void {
  const config = loadConfig()
  const provider = config.providers.find((p) => p.name === name)
  if (!provider) {
    throw new Error(`Provider ${name} is not configured`)
  }
  config.activeEmbeddingProvider = name
  saveConfig(config)
}

export function addProvider(provider: Provider): void {
  const config = loadConfig()
  const existing = config.providers.findIndex((p) => p.name === provider.name)
  if (provider.isActive) {
    config.providers.forEach((p) => {
      p.isActive = p.name === provider.name
    })
    config.activeProvider = provider.name
  }
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

export { getConfigDir, getConfigFile }

import { logger } from '../utils/logger.js'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface ModelAvailabilityStatus {
  id: string
  provider: string
  available: boolean
  reason?: string
  lastChecked: number
  errorCount: number
}

export interface ModelValidationCache {
  models: ModelAvailabilityStatus[]
  provider: string
  lastValidated: number
  ttlMs: number
}

const CACHE_DIR = join(process.env.HOME || '~', '.spectre', 'cache')
const CACHE_TTL_MS = 60 * 60 * 1000

const KNOWN_UNAVAILABLE_PATTERNS = [
  'deep-research',
  'interaction-only',
  'preview-04-2026',
  'gemini-2.0-flash',
  'gemini-1.0',
  'text-bison',
  'chat-bison',
  'code-bison',
  'embedding-gecko',
]

export class ModelValidator {
  private cachePath: string

  constructor() {
    this.cachePath = CACHE_DIR
    if (!existsSync(this.cachePath)) {
      mkdirSync(this.cachePath, { recursive: true, mode: 0o700 })
    }
  }

  async validateModels(
    provider: string,
    modelIds: string[],
    checkFn: (modelId: string) => Promise<{ available: boolean; reason?: string }>,
  ): Promise<ModelAvailabilityStatus[]> {
    const cached = this.loadCache(provider)
    if (cached && Date.now() - cached.lastValidated < cached.ttlMs) {
      logger.debug(`Using cached model validation for ${provider} (${cached.models.length} models)`)
      return cached.models
    }

    const results: ModelAvailabilityStatus[] = []

    for (const modelId of modelIds) {
      if (this.isKnownUnavailable(modelId)) {
        results.push({
          id: modelId,
          provider,
          available: false,
          reason: 'Known unavailable model (deprecated or restricted)',
          lastChecked: Date.now(),
          errorCount: 0,
        })
        continue
      }

      try {
        const checkResult = await Promise.race([
          checkFn(modelId),
          new Promise<{ available: boolean; reason?: string }>((_, reject) =>
            setTimeout(() => reject(new Error('Validation timeout')), 5000),
          ),
        ])

        results.push({
          id: modelId,
          provider,
          available: checkResult.available,
          reason: checkResult.reason,
          lastChecked: Date.now(),
          errorCount: checkResult.available ? 0 : 1,
        })
      } catch (error) {
        results.push({
          id: modelId,
          provider,
          available: false,
          reason: error instanceof Error ? error.message : 'Validation failed',
          lastChecked: Date.now(),
          errorCount: 1,
        })
      }
    }

    this.saveCache(provider, results)
    logger.info(`Validated ${results.filter((r) => r.available).length}/${results.length} models for ${provider}`)
    return results
  }

  async validateSingleModel(
    provider: string,
    modelId: string,
    checkFn: (modelId: string) => Promise<{ available: boolean; reason?: string }>,
  ): Promise<ModelAvailabilityStatus> {
    if (this.isKnownUnavailable(modelId)) {
      return {
        id: modelId,
        provider,
        available: false,
        reason: 'Known unavailable model (deprecated or restricted)',
        lastChecked: Date.now(),
        errorCount: 0,
      }
    }

    try {
      const checkResult = await Promise.race([
        checkFn(modelId),
        new Promise<{ available: boolean; reason?: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), 5000),
        ),
      ])

      return {
        id: modelId,
        provider,
        available: checkResult.available,
        reason: checkResult.reason,
        lastChecked: Date.now(),
        errorCount: checkResult.available ? 0 : 1,
      }
    } catch (error) {
      return {
        id: modelId,
        provider,
        available: false,
        reason: error instanceof Error ? error.message : 'Validation failed',
        lastChecked: Date.now(),
        errorCount: 1,
      }
    }
  }

  markModelUnavailable(provider: string, modelId: string, reason: string): void {
    const cached = this.loadCache(provider)
    if (cached) {
      const existing = cached.models.find((m) => m.id === modelId)
      if (existing) {
        existing.available = false
        existing.reason = reason
        existing.errorCount++
        existing.lastChecked = Date.now()
      } else {
        cached.models.push({
          id: modelId,
          provider,
          available: false,
          reason,
          lastChecked: Date.now(),
          errorCount: 1,
        })
      }
      this.saveCache(provider, cached.models)
    }
  }

  getAvailableModels(provider: string): string[] {
    const cached = this.loadCache(provider)
    if (!cached) return []
    return cached.models.filter((m) => m.available).map((m) => m.id)
  }

  getModelStatus(provider: string, modelId: string): ModelAvailabilityStatus | undefined {
    const cached = this.loadCache(provider)
    if (!cached) return undefined
    return cached.models.find((m) => m.id === modelId)
  }

  clearCache(provider?: string): void {
    if (provider) {
      const path = join(this.cachePath, `models-${provider}.json`)
      if (existsSync(path)) {
        writeFileSync(path, '', { mode: 0o600 })
      }
    } else {
      const files = ['openai', 'anthropic', 'gemini', 'ollama'].map((p) =>
        join(this.cachePath, `models-${p}.json`),
      )
      for (const file of files) {
        if (existsSync(file)) {
          writeFileSync(file, '', { mode: 0o600 })
        }
      }
    }
  }

  private isKnownUnavailable(modelId: string): boolean {
    const lowerId = modelId.toLowerCase()
    return KNOWN_UNAVAILABLE_PATTERNS.some((pattern) => lowerId.includes(pattern.toLowerCase()))
  }

  private getCachePath(provider: string): string {
    return join(this.cachePath, `models-${provider}.json`)
  }

  private loadCache(provider: string): ModelValidationCache | null {
    const path = this.getCachePath(provider)
    if (!existsSync(path)) return null

    try {
      const data = readFileSync(path, 'utf-8')
      if (!data.trim()) return null
      return JSON.parse(data) as ModelValidationCache
    } catch {
      return null
    }
  }

  private saveCache(provider: string, models: ModelAvailabilityStatus[]): void {
    const cache: ModelValidationCache = {
      models,
      provider,
      lastValidated: Date.now(),
      ttlMs: CACHE_TTL_MS,
    }
    const path = this.getCachePath(provider)
    writeFileSync(path, JSON.stringify(cache, null, 2), { mode: 0o600 })
  }
}

export const modelValidator = new ModelValidator()

import { logger } from '../utils/logger.js'

export interface RetryConfig {
  maxAttempts: number
  initialDelayMs: number
  backoffMultiplier: number
  transientErrorPatterns: RegExp[]
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  backoffMultiplier: 2,
  transientErrorPatterns: [
    /timeout/i,
    /ECONNREFUSED/,
    /ECONNRESET/,
    /ETIMEDOUT/,
    /network/i,
    /temporarily unavailable/i,
    /rate limit/i,
    /too many requests/i,
    /503|502|429/,
  ],
}

function isTransientError(error: string): boolean {
  return DEFAULT_CONFIG.transientErrorPatterns.some((pattern) => pattern.test(error))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function executeWithRetry<T>(
  taskName: string,
  executeTask: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null
  let delayMs = finalConfig.initialDelayMs

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        logger.info(`Retry attempt ${attempt}/${finalConfig.maxAttempts} for task: ${taskName}`)
      }
      return await executeTask()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      lastError = error instanceof Error ? error : new Error(errorMsg)

      if (attempt === finalConfig.maxAttempts) {
        logger.error(
          `Task "${taskName}" failed after ${finalConfig.maxAttempts} attempts: ${errorMsg}`,
        )
        throw lastError
      }

      // Only retry if it's a transient error
      if (!isTransientError(errorMsg)) {
        logger.warn(`Non-transient error in task "${taskName}", not retrying: ${errorMsg}`)
        throw lastError
      }

      logger.warn(
        `Task "${taskName}" attempt ${attempt}/${finalConfig.maxAttempts} failed: ${errorMsg}. Retrying in ${delayMs}ms...`,
      )

      await sleep(delayMs)
      delayMs = Math.min(delayMs * finalConfig.backoffMultiplier, 10000) // Cap at 10 seconds
    }
  }

  throw lastError || new Error(`Task "${taskName}" failed after ${finalConfig.maxAttempts} attempts`)
}

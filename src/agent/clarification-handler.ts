import { logger } from '../utils/logger.js'

export interface ClarificationRequest {
  id: string
  question: string
  context: string
  createdAt: number
  timeoutMs: number
  resolved: boolean
  response?: string
}

export type ClarificationCallback = (question: string, context: string) => Promise<string>

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

export class ClarificationHandler {
  private activeRequest: ClarificationRequest | null = null
  private callback: ClarificationCallback | null = null
  private timeoutId: NodeJS.Timeout | null = null

  setCallback(callback: ClarificationCallback): void {
    this.callback = callback
  }

  async requestClarification(
    question: string,
    context: string = '',
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<string> {
    if (this.activeRequest && !this.activeRequest.resolved) {
      logger.warn('Clarification already pending, resolving previous request')
      this.activeRequest.resolved = true
    }

    this.activeRequest = {
      id: `clarification-${Date.now()}`,
      question,
      context,
      createdAt: Date.now(),
      timeoutMs,
      resolved: false,
    }

    if (this.callback) {
      try {
        const response = await Promise.race([
          this.callback(question, context),
          new Promise<string>((_, reject) => {
            this.timeoutId = setTimeout(
              () => reject(new Error('Clarification timeout')),
              timeoutMs,
            )
          }),
        ])

        if (this.activeRequest) {
          this.activeRequest.resolved = true
          this.activeRequest.response = response
        }

        return response
      } catch (error) {
        if (this.activeRequest) {
          this.activeRequest.resolved = true
        }
        throw error
      } finally {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId)
          this.timeoutId = null
        }
      }
    }

    throw new Error('No clarification handler available')
  }

  getActiveRequest(): ClarificationRequest | null {
    return this.activeRequest
  }

  cancelClarification(): void {
    if (this.activeRequest) {
      this.activeRequest.resolved = true
      this.activeRequest = null
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  hasActiveRequest(): boolean {
    return this.activeRequest !== null && !this.activeRequest.resolved
  }

  clear(): void {
    this.activeRequest = null
    this.callback = null
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

export const clarificationHandler = new ClarificationHandler()

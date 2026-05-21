import { AIProvider } from '../ai/provider.js'
import { TokenTracker } from '../utils/token-tracker.js'
import { logger } from '../utils/logger.js'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_name?: string
}

export interface CompactionResult {
  summary: string
  originalTokens: number
  compactedTokens: number
  compressionRatio: number
}

export interface CompactionConfig {
  thresholdPercentage: number
  maxSummaryTokens: number
  preserveToolResults: boolean
  preserveLastMessages: number
}

const DEFAULT_CONFIG: CompactionConfig = {
  thresholdPercentage: 80,
  maxSummaryTokens: 1024,
  preserveToolResults: false,
  preserveLastMessages: 10,
}

export class SessionCompactor {
  private provider: AIProvider
  private tokenTracker: TokenTracker
  private config: CompactionConfig
  private isCompacting = false
  private previousSummary: string | null = null

  constructor(
    provider: AIProvider,
    tokenTracker: TokenTracker,
    config: Partial<CompactionConfig> = {},
  ) {
    this.provider = provider
    this.tokenTracker = tokenTracker
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  shouldCompact(_contextWindow: number): boolean {
    const usagePercentage = this.tokenTracker.getUsagePercentage()
    return usagePercentage >= this.config.thresholdPercentage
  }

  async compact(
    messages: ConversationMessage[],
    systemMessage: ConversationMessage,
  ): Promise<CompactionResult | null> {
    if (this.isCompacting) {
      logger.debug('Compaction already in progress, skipping')
      return null
    }

    this.isCompacting = true

    try {
      const messagesToCompact = messages.slice(
        1,
        -this.config.preserveLastMessages,
      )

      if (messagesToCompact.length === 0) {
        logger.debug('No messages to compact')
        return null
      }

      const originalTokens = this.tokenTracker.getState().currentSession.totalTokens

      const summary = await this.generateSummary(messagesToCompact)

      const compactedMessages: ConversationMessage[] = [
        systemMessage,
        ...(this.previousSummary
          ? [{ role: 'assistant' as const, content: this.previousSummary }]
          : []),
        {
          role: 'assistant' as const,
          content: `[COMPACTION SUMMARY]\n${summary}\n[END COMPACTION SUMMARY]`,
        },
        ...messages.slice(-this.config.preserveLastMessages),
      ]

      const compactedText = compactedMessages.map((m) => m.content).join('')
      const compactedTokens = TokenTracker.estimateTokens(compactedText)

      this.previousSummary = `[COMPACTION SUMMARY]\n${summary}\n[END COMPACTION SUMMARY]`

      const compressionRatio =
        originalTokens > 0
          ? Math.round((1 - compactedTokens / originalTokens) * 100)
          : 0

      logger.info(
        `Compaction complete: ${originalTokens} → ${compactedTokens} tokens (${compressionRatio}% reduction)`,
      )

      return {
        summary,
        originalTokens,
        compactedTokens,
        compressionRatio,
      }
    } catch (error) {
      logger.warn(
        `Compaction failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    } finally {
      this.isCompacting = false
    }
  }

  private async generateSummary(messages: ConversationMessage[]): Promise<string> {
    const conversationText = messages
      .map((m) => {
        const prefix = m.role === 'tool' ? `[${m.tool_name || 'tool'}]` : m.role
        return `${prefix}: ${m.content}`
      })
      .join('\n')

    const prompt = `Summarize the following conversation context concisely. Focus on:
1. Key decisions made
2. Files read or modified
3. Commands executed and their results
4. Current state of the task
5. Any pending action items

Conversation:
${conversationText}

Provide a structured summary that preserves all actionable context.`

    const summary = await this.provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: this.config.maxSummaryTokens,
    })

    return summary.trim()
  }

  getPreviousSummary(): string | null {
    return this.previousSummary
  }

  setPreviousSummary(summary: string): void {
    this.previousSummary = summary
  }

  clearPreviousSummary(): void {
    this.previousSummary = null
  }

  getConfig(): CompactionConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<CompactionConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionCompactor } from '../../src/agent/compactor.js'
import { TokenTracker } from '../../src/utils/token-tracker.js'
import { AIProvider } from '../../src/ai/provider.js'

function mockProvider(summary: string): AIProvider {
  return {
    name: 'mock',
    capabilities: { chat: true, streaming: true, embeddings: true, embeddingDimension: 3 },
    generateCompletion: vi.fn().mockResolvedValue(summary),
    generateCompletionStream: vi.fn(),
    generateEmbedding: vi.fn(),
    generateWithContext: vi.fn(),
    countTokens: vi.fn(),
  }
}

describe('SessionCompactor', () => {
  let tracker: TokenTracker

  beforeEach(() => {
    tracker = new TokenTracker(10000)
  })

  it('should detect when compaction is needed', () => {
    const provider = mockProvider('summary')
    const compactor = new SessionCompactor(provider, tracker, { thresholdPercentage: 80 })

    tracker.addUsage({ totalTokens: 8000 })
    expect(compactor.shouldCompact(10000)).toBe(true)

    tracker.reset()
    tracker.addUsage({ totalTokens: 5000 })
    expect(compactor.shouldCompact(10000)).toBe(false)
  })

  it('should compact messages and return summary', async () => {
    const provider = mockProvider('Key decisions: used TypeScript\nFiles modified: app.tsx')
    const compactor = new SessionCompactor(provider, tracker, { preserveLastMessages: 2 })

    const messages = [
      { role: 'system' as const, content: 'You are an assistant' },
      { role: 'user' as const, content: 'Help me refactor this' },
      { role: 'assistant' as const, content: 'I will refactor the code' },
      { role: 'user' as const, content: 'Thanks, now test it' },
      { role: 'assistant' as const, content: 'Tests pass' },
      { role: 'user' as const, content: 'msg3' },
      { role: 'assistant' as const, content: 'resp3' },
    ]

    const systemMessage = messages[0]
    const result = await compactor.compact(messages, systemMessage)

    expect(result).not.toBeNull()
    expect(result?.summary).toContain('Key decisions')
    expect(result?.originalTokens).toBeGreaterThanOrEqual(0)
    expect(result?.compactedTokens).toBeGreaterThanOrEqual(0)
  })

  it('should not compact when no messages to compact', async () => {
    const provider = mockProvider('summary')
    const compactor = new SessionCompactor(provider, tracker, { preserveLastMessages: 10 })

    const messages = [
      { role: 'system' as const, content: 'You are an assistant' },
      { role: 'user' as const, content: 'Hello' },
    ]

    const result = await compactor.compact(messages, messages[0])
    expect(result).toBeNull()
  })

  it('should prevent concurrent compaction', async () => {
    const provider = mockProvider('summary')
    const compactor = new SessionCompactor(provider, tracker, { preserveLastMessages: 2 })

    const messages = [
      { role: 'system' as const, content: 'system' },
      { role: 'user' as const, content: 'msg1' },
      { role: 'assistant' as const, content: 'resp1' },
      { role: 'user' as const, content: 'msg2' },
      { role: 'assistant' as const, content: 'resp2' },
      { role: 'user' as const, content: 'msg3' },
      { role: 'assistant' as const, content: 'resp3' },
    ]

    const [result1, result2] = await Promise.all([
      compactor.compact(messages, messages[0]),
      compactor.compact(messages, messages[0]),
    ])

    expect(result1).not.toBeNull()
    expect(result2).toBeNull()
  })

  it('should preserve previous summary across compactions', async () => {
    const provider = mockProvider('Summary 1')
    const compactor = new SessionCompactor(provider, tracker, { preserveLastMessages: 2 })

    const messages = [
      { role: 'system' as const, content: 'system' },
      { role: 'user' as const, content: 'msg1' },
      { role: 'assistant' as const, content: 'resp1' },
      { role: 'user' as const, content: 'msg2' },
      { role: 'assistant' as const, content: 'resp2' },
      { role: 'user' as const, content: 'msg3' },
      { role: 'assistant' as const, content: 'resp3' },
    ]

    await compactor.compact(messages, messages[0])
    expect(compactor.getPreviousSummary()).toContain('Summary 1')

    compactor.clearPreviousSummary()
    expect(compactor.getPreviousSummary()).toBeNull()
  })

  it('should update config', () => {
    const provider = mockProvider('summary')
    const compactor = new SessionCompactor(provider, tracker)

    expect(compactor.getConfig().thresholdPercentage).toBe(80)
    compactor.updateConfig({ thresholdPercentage: 90 })
    expect(compactor.getConfig().thresholdPercentage).toBe(90)
  })
})

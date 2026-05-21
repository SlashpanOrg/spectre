import { describe, it, expect, vi } from 'vitest'
import { AgentOrchestrator } from '../../src/agent/orchestrator.js'
import { AIProvider } from '../../src/ai/provider.js'

function mockProvider(planJson: string): AIProvider {
  return {
    name: 'mock',
    capabilities: { chat: true, streaming: true, embeddings: true, embeddingDimension: 3 },
    generateCompletion: vi.fn().mockResolvedValue(planJson),
    generateCompletionStream: vi.fn(),
    generateEmbedding: vi.fn(),
    generateWithContext: vi.fn(),
    countTokens: vi.fn(),
  }
}

describe('AgentOrchestrator', () => {
  it('should execute planned steps through the configured tool executor', async () => {
    const provider = mockProvider('[{"id":"step-1","description":"List sessions","tool":"query","args":"what changed"}]')
    const executor = vi.fn().mockResolvedValue('query result')
    const orchestrator = new AgentOrchestrator(provider, executor)

    const task = await orchestrator.execute('answer a code question')

    expect(executor).toHaveBeenCalledWith('query', 'what changed')
    expect(task.status).toBe('completed')
    expect(task.steps[0].result).toBe('query result')
  })

  it('should fail a tool step when no tool executor is configured', async () => {
    const provider = mockProvider('[{"id":"step-1","description":"Index repo","tool":"index","args":"."}]')
    const orchestrator = new AgentOrchestrator(provider)

    const task = await orchestrator.execute('index this repo')

    expect(task.status).toBe('failed')
    expect(task.steps[0].error).toContain('No tool executor configured')
  })
})

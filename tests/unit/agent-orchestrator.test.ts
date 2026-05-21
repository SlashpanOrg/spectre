import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AgentOrchestrator } from '../../src/agent/orchestrator.js'
import { ToolRegistry } from '../../src/agent/tools/registry.js'
import { AIProvider } from '../../src/ai/provider.js'

function mockProvider(response: string): AIProvider {
  return {
    name: 'mock',
    capabilities: { chat: true, streaming: true, embeddings: true, embeddingDimension: 3 },
    generateCompletion: vi.fn().mockResolvedValue(response),
    generateCompletionStream: vi.fn(async function* () {
      yield response
    }),
    generateEmbedding: vi.fn(),
    generateWithContext: vi.fn(),
    countTokens: vi.fn(),
  }
}

describe('AgentOrchestrator (Conversation-First)', () => {
  let registry: ToolRegistry

  beforeEach(() => {
    registry = new ToolRegistry()
  })

  it('should initialize with system message', async () => {
    const provider = mockProvider('test')
    const orchestrator = new AgentOrchestrator(provider, registry)
    await orchestrator.initialize()
    const state = orchestrator.getConversationState()

    expect(state.messages.length).toBeGreaterThanOrEqual(1)
    expect(state.messages[0].role).toBe('system')
    expect(state.messages[0].content).toContain('read_file')
    expect(state.messages[0].content).toContain('write_file')
  })

  it('should process a user message and return assistant response', async () => {
    const provider = mockProvider('Hello! How can I help you today?')
    const orchestrator = new AgentOrchestrator(provider, registry)
    await orchestrator.initialize()

    const response = await orchestrator.processMessage('Hello')
    expect(response).toContain('Hello! How can I help you today?')
  })

  it('should track token usage after messages', async () => {
    const provider = mockProvider('Short response')
    const orchestrator = new AgentOrchestrator(provider, registry)
    await orchestrator.initialize()

    await orchestrator.processMessage('Hello there')
    const stats = orchestrator.getTokenStats()

    expect(stats.currentSession.totalTokens).toBeGreaterThan(0)
  })

  it('should reset conversation state', async () => {
    const provider = mockProvider('Response')
    const orchestrator = new AgentOrchestrator(provider, registry)
    await orchestrator.initialize()

    await orchestrator.processMessage('Message 1')
    await orchestrator.processMessage('Message 2')

    await orchestrator.resetConversation()
    const state = orchestrator.getConversationState()

    expect(state.messages.length).toBeGreaterThanOrEqual(1)
    expect(state.messages[0].role).toBe('system')
  })

  it('should return all registered tool names', () => {
    const names = registry.getNames()
    expect(names.length).toBeGreaterThanOrEqual(7)
    expect(names).toContain('read_file')
    expect(names).toContain('write_file')
    expect(names).toContain('edit_file')
    expect(names).toContain('run_command')
  })
})

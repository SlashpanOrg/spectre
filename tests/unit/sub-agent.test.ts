import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubAgent, SubAgentOrchestrator } from '../../src/agent/sub-agent.js'
import { ToolRegistry } from '../../src/agent/tools/registry.js'
import { PermissionManager } from '../../src/agent/permissions.js'
import { AIProvider } from '../../src/ai/provider.js'
import { tmpdir } from 'os'
import { join } from 'path'
import { mkdirSync, existsSync, rmSync } from 'fs'

function mockProvider(response: string): AIProvider {
  return {
    name: 'mock',
    capabilities: { chat: true, streaming: true, embeddings: true, embeddingDimension: 3 },
    generateCompletion: vi.fn().mockResolvedValue(response),
    generateCompletionStream: vi.fn(),
    generateEmbedding: vi.fn(),
    generateWithContext: vi.fn(),
    countTokens: vi.fn(),
  }
}

describe('SubAgent', () => {
  let testDir: string
  let provider: AIProvider
  let registry: ToolRegistry
  let permissions: PermissionManager

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-subagent-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)

    provider = mockProvider('Task completed successfully')
    registry = new ToolRegistry()
    permissions = new PermissionManager(testDir)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should execute a task and return result', async () => {
    const agent = new SubAgent('test-1', provider, registry, permissions, testDir)
    const result = await agent.execute('Analyze the codebase')

    expect(result.success).toBe(true)
    expect(result.result).toContain('completed')
    expect(result.taskId).toBe('test-1')
  })

  it('should track task status', async () => {
    const agent = new SubAgent('test-2', provider, registry, permissions, testDir)

    let statusUpdates: string[] = []
    const onStatus = vi.fn((_, status) => {
      statusUpdates.push(status.status)
    })

    await agent.execute('Test task', onStatus)

    expect(statusUpdates).toContain('running')
  })

  it('should handle interruption', async () => {
    const agent = new SubAgent('test-3', provider, registry, permissions, testDir)

    const executePromise = agent.execute('Long task')
    agent.interrupt()

    const result = await executePromise
    expect(result.success).toBe(false)
  })

  it('should handle execution errors', async () => {
    const errorProvider = mockProvider('')
    vi.mocked(errorProvider.generateCompletion).mockRejectedValue(new Error('API failure'))

    const agent = new SubAgent('test-4', errorProvider, registry, permissions, testDir)
    const result = await agent.execute('Fail task')

    expect(result.success).toBe(false)
    expect(result.error).toContain('API failure')
  })

  it('should return current task', async () => {
    const agent = new SubAgent('test-5', provider, registry, permissions, testDir)
    expect(agent.getCurrentTask()).toBeNull()

    await agent.execute('Task')
    const task = agent.getCurrentTask()

    expect(task).not.toBeNull()
    expect(task?.status).toBe('completed')
  })
})

describe('SubAgentOrchestrator', () => {
  let testDir: string
  let provider: AIProvider
  let registry: ToolRegistry

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-orchestrator-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)

    provider = mockProvider('Done')
    registry = new ToolRegistry()
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should spawn and execute multiple tasks', async () => {
    const orchestrator = new SubAgentOrchestrator(provider, registry, testDir, 2)

    const tasks = [
      { id: 'task-1', description: 'Task 1' },
      { id: 'task-2', description: 'Task 2' },
      { id: 'task-3', description: 'Task 3' },
    ]

    const results = await orchestrator.spawnTasks(tasks)

    expect(results).toHaveLength(3)
    expect(results.every((r) => r.success)).toBe(true)
  })

  it('should respect max concurrent limit', async () => {
    const orchestrator = new SubAgentOrchestrator(provider, registry, testDir, 1)

    const tasks = [
      { id: 'task-1', description: 'Task 1' },
      { id: 'task-2', description: 'Task 2' },
    ]

    await orchestrator.spawnTasks(tasks)
    expect(orchestrator.getActiveAgents().size).toBe(0)
  })

  it('should interrupt all active agents', async () => {
    const orchestrator = new SubAgentOrchestrator(provider, registry, testDir, 2)

    const tasks = [
      { id: 'task-1', description: 'Long task 1' },
      { id: 'task-2', description: 'Long task 2' },
    ]

    const promise = orchestrator.spawnTasks(tasks)
    orchestrator.interruptAll()

    const results = await promise
    expect(results.some((r) => !r.success)).toBe(true)
  })

  it('should update max concurrent setting', () => {
    const orchestrator = new SubAgentOrchestrator(provider, registry, testDir, 2)
    orchestrator.setMaxConcurrent(5)

    expect(orchestrator.getActiveAgents().size).toBe(0)
  })
})

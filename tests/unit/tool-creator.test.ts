import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { ToolCreator } from '../../src/agent/tools/tool-creator.js'
import { ToolRegistry } from '../../src/agent/tools/registry.js'
import { AIProvider } from '../../src/ai/provider.js'

function mockProvider(code: string): AIProvider {
  return {
    name: 'mock',
    capabilities: { chat: true, streaming: true, embeddings: false },
    generateCompletion: vi.fn().mockResolvedValue(code),
    generateCompletionStream: vi.fn(),
    generateEmbedding: vi.fn(),
    generateWithContext: vi.fn(),
    countTokens: vi.fn(),
  }
}

const validToolCode = `import type { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const shoutTool: ToolDefinition = {
  name: 'shout',
  description: 'Convert text to uppercase',
  parameters: {
    text: { type: 'string', description: 'Text to convert', required: true },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    return { success: true, output: String(input.text || '').toUpperCase() }
  },
}
`

describe('ToolCreator', () => {
  let testDir: string
  let toolsDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-tool-creator-${Date.now()}-${Math.random()}`)
    toolsDir = join(testDir, 'tools')
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('generates, compiles, and persists a restart-ready tool', async () => {
    const creator = new ToolCreator(mockProvider(validToolCode), toolsDir)

    const result = await creator.createToolFromRequirement('Create a shout tool', 'manual')

    expect(result.success).toBe(true)
    expect(result.toolName).toBe('shout')
    expect(result.metadata.status).toBe('restart-ready')
    expect(existsSync(result.metadata.sourcePath)).toBe(true)
    expect(existsSync(result.metadata.compiledPath)).toBe(true)
  })

  it('loads restart-ready tools into the registry on construction', async () => {
    const creator = new ToolCreator(mockProvider(validToolCode), toolsDir)
    await creator.createToolFromRequirement('Create a shout tool', 'manual')

    const registry = new ToolRegistry(toolsDir)
    const result = await registry.execute('shout', { text: 'hello' })

    expect(result.success).toBe(true)
    expect(result.output).toBe('HELLO')
  })

  it('lists and removes persisted tools', async () => {
    const creator = new ToolCreator(mockProvider(validToolCode), toolsDir)
    await creator.createToolFromRequirement('Create a shout tool', 'manual')

    expect(creator.loadDynamicTools()).toHaveLength(1)
    expect(creator.removeTool('shout')).toBe(true)
    expect(creator.loadDynamicTools()).toHaveLength(0)
  })
})

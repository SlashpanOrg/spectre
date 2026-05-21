import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleGeminiProvider } from '../../src/ai/gemini.js'

vi.mock('@google/generative-ai', () => {
  const mockModel = {
    generateContent: vi.fn().mockResolvedValue({
      response: {
        text: () => 'Hello from Gemini!',
        usageMetadata: { totalTokenCount: 10 },
      },
    }),
    generateContentStream: vi.fn().mockResolvedValue({
      stream: (async function* () {
        yield { text: () => 'Hello' }
        yield { text: () => ' from' }
        yield { text: () => ' Gemini!' }
      })(),
    }),
    countTokens: vi.fn().mockResolvedValue({ totalTokens: 5 }),
  }

  const mockEmbeddingModel = {
    embedContent: vi.fn().mockResolvedValue({
      embedding: { values: [0.1, 0.2, 0.3] },
    }),
  }

  const MockGoogleGenerativeAI = vi.fn(function () {
    return {
      getGenerativeModel: vi.fn((config: { model: string }) => {
        if (config.model.includes('embedding')) {
          return mockEmbeddingModel
        }
        return mockModel
      }),
    }
  })

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  }
})

describe('Google Gemini Provider', () => {
  let provider: GoogleGeminiProvider

  beforeEach(() => {
    provider = new GoogleGeminiProvider('test-api-key', 'gemini-2.0-flash')
  })

  it('should have correct name', () => {
    expect(provider.name).toBe('gemini')
  })

  it('should generate completion', async () => {
    const result = await provider.generateCompletion('Hello')
    expect(result).toBe('Hello from Gemini!')
  })

  it('should generate completion with system prompt', async () => {
    const result = await provider.generateCompletion('Hello', {
      systemPrompt: 'You are helpful',
      temperature: 0.5,
    })
    expect(result).toBe('Hello from Gemini!')
  })

  it('should stream completion', async () => {
    const chunks: string[] = []
    for await (const chunk of provider.generateCompletionStream('Hello')) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual(['Hello', ' from', ' Gemini!'])
  })

  it('should generate embedding', async () => {
    const embedding = await provider.generateEmbedding('test text')
    expect(embedding).toEqual([0.1, 0.2, 0.3])
  })

  it('should generate with context', async () => {
    const result = await provider.generateWithContext(
      'What changed?',
      'Commit abc123: Fixed bug',
    )
    expect(result).toBe('Hello from Gemini!')
  })

  it('should count tokens', async () => {
    const count = await provider.countTokens('Hello world')
    expect(count).toBe(5)
  })
})

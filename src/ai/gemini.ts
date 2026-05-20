import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { AIProvider, CompletionOptions } from './provider.js'
import { logger } from '../utils/logger.js'

export class GoogleGeminiProvider implements AIProvider {
  readonly name = 'gemini'
  private client: GoogleGenerativeAI
  private model: GenerativeModel

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = this.client.getGenerativeModel({ model })
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens,
      },
      ...(options?.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
    })

    const response = result.response
    const content = response.text()
    if (!content) {
      throw new Error('Empty response from Gemini')
    }

    logger.debug('Gemini completion:', response.usageMetadata)
    return content
  }

  async *generateCompletionStream(
    prompt: string,
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const result = await this.model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens,
      },
      ...(options?.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
    })

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        yield text
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddingModel = this.client.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  }

  async generateWithContext(question: string, context: string): Promise<string> {
    const prompt = `Context:
${context}

Question: ${question}

Answer based on the provided context. If the context does not contain enough information, say so clearly.`

    return this.generateCompletion(prompt, {
      systemPrompt:
        'You are Nexus, an AI assistant analyzing codebase and workflow data. Use the provided context to answer the question.',
      temperature: 0.3,
    })
  }

  async countTokens(text: string): Promise<number> {
    const result = await this.model.countTokens({
      contents: [{ role: 'user', parts: [{ text }] }],
    })
    return result.totalTokens ?? 0
  }
}

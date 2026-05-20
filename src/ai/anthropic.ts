import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, CompletionOptions } from './provider.js'
import { logger } from '../utils/logger.js'

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model || this.model,
      max_tokens: options?.maxTokens ?? 4096,
      system: options?.systemPrompt,
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: options?.temperature ?? 0.3,
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Empty response from Anthropic')
    }

    logger.debug('Anthropic completion:', response.usage)
    return content.text
  }

  async *generateCompletionStream(
    prompt: string,
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const stream = await this.client.messages.stream({
      model: options?.model || this.model,
      max_tokens: options?.maxTokens ?? 4096,
      system: options?.systemPrompt,
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: options?.temperature ?? 0.3,
    })

    for await (const chunk of stream) {
      if (chunk.type === 'text_delta') {
        yield chunk.text
      }
    }
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error(
      'Anthropic does not support embeddings. Use OpenAI or a dedicated embedding model.',
    )
  }

  async generateWithContext(question: string, context: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system:
        'You are Spectre, an AI assistant analyzing Git history. Use the provided context to answer the question. If the context does not contain enough information, say so clearly.',
      messages: [
        { role: 'user' as const, content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
      temperature: 0.3,
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Empty response from Anthropic')
    }

    return content.text
  }

  async countTokens(text: string): Promise<number> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1,
      messages: [{ role: 'user' as const, content: text }],
    })

    return response.usage?.input_tokens ?? 0
  }
}

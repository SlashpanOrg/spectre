import OpenAI from 'openai'
import { AIProvider, CompletionOptions } from './provider.js'
import { logger } from '../utils/logger.js'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.model,
      messages: [
        ...(options?.systemPrompt
          ? [{ role: 'system' as const, content: options.systemPrompt }]
          : []),
        { role: 'user' as const, content: prompt },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    logger.debug('OpenAI completion:', response.usage)
    return content
  }

  async *generateCompletionStream(
    prompt: string,
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.model,
      messages: [
        ...(options?.systemPrompt
          ? [{ role: 'system' as const, content: options.systemPrompt }]
          : []),
        { role: 'user' as const, content: prompt },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens,
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return response.data[0].embedding
  }

  async countTokens(text: string): Promise<number> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user' as const, content: text }],
      max_tokens: 1,
    })

    return response.usage?.total_tokens ?? 0
  }
}

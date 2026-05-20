import OpenAI from 'openai'
import { AIProvider, CompletionOptions } from './provider.js'
import { logger } from '../utils/logger.js'

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama'
  private client: OpenAI
  private model: string

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3') {
    this.client = new OpenAI({
      apiKey: 'ollama',
      baseURL: `${baseUrl}/v1`,
    })
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
      throw new Error('Empty response from Ollama')
    }

    logger.debug('Ollama completion:', response.usage)
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
      model: 'nomic-embed-text',
      input: text,
    })

    return response.data[0].embedding
  }

  async countTokens(text: string): Promise<number> {
    return text.split(/\s+/).length
  }
}

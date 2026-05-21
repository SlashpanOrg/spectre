export type ProviderName = 'openai' | 'anthropic' | 'ollama' | 'gemini'

export interface ProviderCapabilities {
  chat: boolean
  streaming: boolean
  embeddings: boolean
  embeddingModel?: string
  embeddingDimension?: number
}

export interface AIProvider {
  name: string
  capabilities: ProviderCapabilities
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>
  generateCompletionStream(prompt: string, options?: CompletionOptions): AsyncIterable<string>
  generateEmbedding(text: string): Promise<number[]>
  generateWithContext(question: string, context: string): Promise<string>
  countTokens(text: string): Promise<number>
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface ProviderConfig {
  name: ProviderName
  apiKey?: string
  baseUrl?: string
  model: string
}

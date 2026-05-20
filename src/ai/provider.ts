export interface AIProvider {
  name: string
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>
  generateCompletionStream(prompt: string, options?: CompletionOptions): AsyncIterable<string>
  generateEmbedding(text: string): Promise<number[]>
  countTokens(text: string): Promise<number>
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface ProviderConfig {
  name: 'openai' | 'anthropic' | 'ollama'
  apiKey?: string
  baseUrl?: string
  model: string
}

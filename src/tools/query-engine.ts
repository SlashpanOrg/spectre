import { VectorStore } from '../storage/vector-store.js'
import { MetadataStore } from '../storage/metadata-store.js'
import {
  getEmbeddingProvider,
  getProvider,
  getProviderEmbeddingDimension,
  getProviderVectorCollectionName,
} from '../ai/config.js'
import { ProviderName } from '../ai/provider.js'
import { loadConfig } from '../utils/config.js'
import { logger } from '../utils/logger.js'

export interface QueryResult {
  answer: string
  evidence: Array<{
    hash: string
    message: string
    author: string
    date: string
    score: number
    files: string[]
  }>
  duration: number
}

export class QueryEngine {
  private metadataStore: MetadataStore
  private qdrantUrl: string

  constructor() {
    const config = loadConfig()
    this.qdrantUrl = config.qdrantUrl
    this.metadataStore = new MetadataStore(config.dbPath)
  }

  async query(question: string, limit: number = 10): Promise<QueryResult> {
    const startTime = Date.now()
    const chatProvider = getProvider()
    const embeddingProvider = getEmbeddingProvider()
    const embeddingProviderName = embeddingProvider.name as ProviderName
    const vectorStore = new VectorStore(
      this.qdrantUrl,
      getProviderVectorCollectionName(embeddingProviderName),
    )
    await vectorStore.initialize(getProviderEmbeddingDimension(embeddingProviderName))

    const questionEmbedding = await embeddingProvider.generateEmbedding(question)
    const vectorResults = await vectorStore.search(questionEmbedding, limit)

    const evidence = vectorResults.map((r) => ({
      hash: r.payload.hash as string,
      message: r.payload.message as string,
      author: r.payload.author as string,
      date: r.payload.date as string,
      score: r.score,
      files: (r.payload.files as string[]) || [],
    }))

    const context = this.buildContext(evidence, question)
    const answer = await chatProvider.generateWithContext(question, context)

    const duration = Date.now() - startTime

    const queryResult: QueryResult = {
      answer,
      evidence,
      duration,
    }

    this.metadataStore.saveQuery({
      id: `query-${Date.now()}`,
      query: question,
      answer,
      timestamp: new Date().toISOString(),
      evidenceCount: evidence.length,
    })

    logger.info(`Query answered in ${duration}ms with ${evidence.length} evidence`)
    return queryResult
  }

  private buildContext(
    evidence: Array<{
      hash: string
      message: string
      author: string
      date: string
      score: number
      files: string[]
    }>,
    question: string,
  ): string {
    return `Question: ${question}

Relevant commits:
${evidence
  .map(
    (e) =>
      `- [${e.hash.substring(0, 7)}] ${e.message} by ${e.author} on ${e.date} (score: ${e.score.toFixed(2)})
  Files: ${e.files.join(', ')}`,
  )
  .join('\n')}`
  }

  getHistory(limit: number = 20) {
    return this.metadataStore.getQueryHistory(limit)
  }

  close(): void {
    this.metadataStore.close()
  }
}

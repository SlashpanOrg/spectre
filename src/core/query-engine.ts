import { getProvider } from '../ai/config.js'
import { VectorStore } from '../storage/vector-store.js'
import { MetadataStore } from '../storage/metadata-store.js'
import { KnowledgeGraph, EvidenceItem } from './knowledge-graph.js'
import { logger } from '../utils/logger.js'

export interface QueryResult {
  answer: string
  evidence: EvidenceItem[]
  sources: string[]
  confidence: number
}

const SYSTEM_PROMPT = `You are Spectre, an AI Development Intelligence Agent. You analyze Git repository data to answer questions about codebase history, decisions, and patterns.

When answering:
1. Be specific and cite evidence (commit hashes, authors, dates, files)
2. If uncertain, say so clearly
3. Provide context from commit messages and file changes
4. Link answers to specific commits when possible
5. Keep answers concise but thorough

Format your response with clear sections and reference commit hashes (short form, 7 chars).`

export class QueryEngine {
  private vectorStore: VectorStore
  private metadataStore: MetadataStore
  private cache: Map<string, QueryResult> = new Map()

  constructor(
    vectorStore: VectorStore,
    metadataStore: MetadataStore,
    _knowledgeGraph: KnowledgeGraph,
  ) {
    this.vectorStore = vectorStore
    this.metadataStore = metadataStore
  }

  async query(question: string): Promise<QueryResult> {
    const cacheKey = question.toLowerCase().trim()
    if (this.cache.has(cacheKey)) {
      logger.debug('Returning cached query result')
      return this.cache.get(cacheKey)!
    }

    const provider = getProvider()
    const embedding = await provider.generateEmbedding(question)

    const similarCommits = await this.vectorStore.search(embedding, 10)

    const context = this.buildContext(similarCommits)

    const prompt = `Question: ${question}

Relevant commit data:
${context}

Answer the question based on the commit data above. If the data doesn't contain enough information, say so and provide the best answer you can with what's available.`

    const answer = await provider.generateCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.3,
    })

    const evidence = this.extractEvidence(similarCommits)
    const sources = similarCommits.map((r) => r.id as string)

    const result: QueryResult = {
      answer,
      evidence,
      sources,
      confidence: this.calculateConfidence(similarCommits),
    }

    this.cache.set(cacheKey, result)

    this.metadataStore.saveQuery({
      id: Date.now().toString(),
      query: question,
      answer: answer.substring(0, 500),
      timestamp: new Date().toISOString(),
      evidenceCount: evidence.length,
    })

    return result
  }

  private buildContext(
    results: Array<{ id: string; score: number; payload: Record<string, unknown> }>,
  ): string {
    return results
      .map((r) => {
        const p = r.payload
        return `Commit: ${(p.hash as string)?.substring(0, 7)}
Author: ${p.author} <${p.email}>
Date: ${p.date}
Message: ${p.message}
Files: ${(p.files as string[])?.join(', ')}
Relevance: ${(r.score * 100).toFixed(0)}%
---`
      })
      .join('\n\n')
  }

  private extractEvidence(
    results: Array<{ id: string; score: number; payload: Record<string, unknown> }>,
  ): EvidenceItem[] {
    return results.map((r) => ({
      type: 'commit' as const,
      hash: r.payload.hash as string,
      author: r.payload.author as string,
      message: r.payload.message as string,
      date: r.payload.date as string,
      confidence: r.score,
    }))
  }

  private calculateConfidence(results: Array<{ score: number }>): number {
    if (results.length === 0) return 0
    const topScore = results[0].score
    return Math.min(topScore * 1.5, 1)
  }

  getCacheSize(): number {
    return this.cache.size
  }

  clearCache(): void {
    this.cache.clear()
  }
}

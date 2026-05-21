import { QdrantClient } from '@qdrant/js-client-rest'
import { logger } from '../utils/logger.js'

export interface VectorPoint {
  id: string
  vector: number[]
  payload: Record<string, unknown>
}

export class VectorStore {
  private client: QdrantClient
  private collectionName: string
  private vectorSize?: number

  constructor(url: string = 'http://localhost:6333', collectionName: string = 'spectre') {
    this.client = new QdrantClient({ url })
    this.collectionName = collectionName
  }

  async initialize(vectorSize: number = 1536): Promise<void> {
    this.vectorSize = vectorSize
    const collections = await this.client.getCollections()
    const exists = collections.collections.some((c) => c.name === this.collectionName)

    if (!exists) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      })
      logger.info(`Created Qdrant collection: ${this.collectionName}`)
      return
    }

    const info = await this.client.getCollection(this.collectionName)
    const existingSize = this.extractVectorSize(info)
    if (existingSize !== undefined && existingSize !== vectorSize) {
      throw new Error(
        `Qdrant collection ${this.collectionName} dimension mismatch: expected ${vectorSize}, found ${existingSize}. Use a provider/dimension-specific collection or reindex.`,
      )
    }
  }

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return
    this.assertInitialized()
    points.forEach((point) => this.assertVectorDimension(point.vector))

    await this.client.upsert(this.collectionName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    })

    logger.debug(`Upserted ${points.length} points to Qdrant`)
  }

  async search(
    vector: number[],
    limit: number = 10,
  ): Promise<Array<{ id: string; score: number; payload: Record<string, unknown> }>> {
    this.assertInitialized()
    this.assertVectorDimension(vector)

    const results = await this.client.search(this.collectionName, {
      vector,
      limit,
    })

    return results.map((r) => ({
      id: r.id as string,
      score: r.score,
      payload: r.payload || {},
    }))
  }

  async deleteCollection(): Promise<void> {
    await this.client.deleteCollection(this.collectionName)
    logger.info(`Deleted Qdrant collection: ${this.collectionName}`)
  }

  async getPointCount(): Promise<number> {
    const info = await this.client.getCollection(this.collectionName)
    return info.points_count ?? 0
  }

  private assertInitialized(): void {
    if (!this.vectorSize) {
      throw new Error('Vector store has not been initialized')
    }
  }

  private assertVectorDimension(vector: number[]): void {
    if (this.vectorSize && vector.length !== this.vectorSize) {
      throw new Error(`Expected vector dimension ${this.vectorSize}, received ${vector.length}`)
    }
  }

  private extractVectorSize(info: unknown): number | undefined {
    const vectorConfig = (info as { config?: { params?: { vectors?: unknown } } }).config?.params
      ?.vectors
    if (!vectorConfig) return undefined
    if (typeof (vectorConfig as { size?: unknown }).size === 'number') {
      return (vectorConfig as { size: number }).size
    }
    if (typeof vectorConfig === 'object' && vectorConfig !== null) {
      const firstNamedVector = Object.values(vectorConfig).find(
        (value) => typeof (value as { size?: unknown })?.size === 'number',
      ) as { size?: number } | undefined
      return firstNamedVector?.size
    }
    return undefined
  }
}

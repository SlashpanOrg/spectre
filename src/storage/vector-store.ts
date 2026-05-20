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

  constructor(url: string = 'http://localhost:6333', collectionName: string = 'spectre') {
    this.client = new QdrantClient({ url })
    this.collectionName = collectionName
  }

  async initialize(vectorSize: number = 1536): Promise<void> {
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
    }
  }

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return

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
}

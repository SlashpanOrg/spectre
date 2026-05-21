import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VectorStore } from '../../src/storage/vector-store.js'

const mockClient = {
  getCollections: vi.fn(),
  createCollection: vi.fn(),
  getCollection: vi.fn(),
  upsert: vi.fn(),
  search: vi.fn(),
  deleteCollection: vi.fn(),
}

vi.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: vi.fn(() => mockClient),
}))

describe('VectorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates collections with the configured vector size', async () => {
    mockClient.getCollections.mockResolvedValue({ collections: [] })
    const store = new VectorStore('http://qdrant:6333', 'spectre_openai_1536')

    await store.initialize(1536)

    expect(mockClient.createCollection).toHaveBeenCalledWith('spectre_openai_1536', {
      vectors: { size: 1536, distance: 'Cosine' },
    })
  })

  it('fails early when an existing collection has the wrong vector size', async () => {
    mockClient.getCollections.mockResolvedValue({ collections: [{ name: 'spectre_gemini_768' }] })
    mockClient.getCollection.mockResolvedValue({ config: { params: { vectors: { size: 1536 } } } })
    const store = new VectorStore('http://qdrant:6333', 'spectre_gemini_768')

    await expect(store.initialize(768)).rejects.toThrow(/dimension mismatch/)
  })

  it('rejects points whose vector dimension does not match the collection dimension', async () => {
    mockClient.getCollections.mockResolvedValue({ collections: [] })
    const store = new VectorStore('http://qdrant:6333', 'spectre_openai_1536')
    await store.initialize(1536)

    await expect(
      store.upsertPoints([{ id: 'p1', vector: [0.1, 0.2], payload: {} }]),
    ).rejects.toThrow(/Expected vector dimension 1536/)
    expect(mockClient.upsert).not.toHaveBeenCalled()
  })

  it('rejects search vectors whose dimension does not match the collection dimension', async () => {
    mockClient.getCollections.mockResolvedValue({ collections: [] })
    const store = new VectorStore('http://qdrant:6333', 'spectre_openai_1536')
    await store.initialize(1536)

    await expect(store.search([0.1, 0.2], 10)).rejects.toThrow(/Expected vector dimension 1536/)
    expect(mockClient.search).not.toHaveBeenCalled()
  })
})

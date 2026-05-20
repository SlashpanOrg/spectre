import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeGraph } from '../../src/core/knowledge-graph.js'
import { MetadataStore } from '../../src/storage/metadata-store.js'

describe('KnowledgeGraph', () => {
  let graph: KnowledgeGraph
  let store: MetadataStore

  beforeEach(() => {
    store = new MetadataStore(':memory:')
    graph = new KnowledgeGraph(store)
  })

  it('should add and retrieve nodes', () => {
    graph.addNode({
      id: 'commit-1',
      type: 'commit',
      data: { hash: 'abc123', message: 'Initial commit' },
      connections: [],
    })

    const node = graph.getNode('commit-1')
    expect(node).toBeDefined()
    expect(node?.type).toBe('commit')
    expect(node?.data.hash).toBe('abc123')
  })

  it('should add edges between nodes', () => {
    graph.addNode({
      id: 'commit-1',
      type: 'commit',
      data: { hash: 'abc123' },
      connections: [],
    })
    graph.addNode({
      id: 'author-1',
      type: 'author',
      data: { name: 'John' },
      connections: [],
    })

    graph.addEdge({
      from: 'commit-1',
      to: 'author-1',
      type: 'authored',
      weight: 1,
    })

    const connected = graph.getConnectedNodes('commit-1')
    expect(connected).toHaveLength(1)
    expect(connected[0].id).toBe('author-1')
  })

  it('should search nodes by query', () => {
    graph.addNode({
      id: 'commit-1',
      type: 'commit',
      data: { message: 'Fix authentication bug', hash: 'abc123' },
      connections: [],
    })
    graph.addNode({
      id: 'commit-2',
      type: 'commit',
      data: { message: 'Add user registration', hash: 'def456' },
      connections: [],
    })

    const results = graph.searchNodes('authentication')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('commit-1')
  })

  it('should filter nodes by type', () => {
    graph.addNode({
      id: 'commit-1',
      type: 'commit',
      data: {},
      connections: [],
    })
    graph.addNode({
      id: 'author-1',
      type: 'author',
      data: {},
      connections: [],
    })

    const commits = graph.findNodesByType('commit')
    expect(commits).toHaveLength(1)
  })

  it('should return stats', () => {
    graph.addNode({ id: 'c1', type: 'commit', data: {}, connections: [] })
    graph.addNode({ id: 'c2', type: 'commit', data: {}, connections: [] })
    graph.addNode({ id: 'a1', type: 'author', data: {}, connections: [] })

    const stats = graph.getStats()
    expect(stats.nodes).toBe(3)
    expect(stats.byType.commit).toBe(2)
    expect(stats.byType.author).toBe(1)
  })
})

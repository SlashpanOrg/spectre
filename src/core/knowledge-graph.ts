import { MetadataStore } from '../storage/metadata-store.js'
import { logger } from '../utils/logger.js'

export interface KnowledgeNode {
  id: string
  type: 'commit' | 'author' | 'file' | 'branch'
  data: Record<string, unknown>
  connections: string[]
}

export interface KnowledgeEdge {
  from: string
  to: string
  type: 'authored' | 'modified' | 'belongs_to' | 'related'
  weight: number
}

export interface EvidenceItem {
  type: 'commit' | 'file' | 'author'
  hash?: string
  filePath?: string
  author?: string
  message?: string
  date?: string
  confidence: number
  snippet?: string
}

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map()
  private edges: KnowledgeEdge[] = []
  private metadataStore: MetadataStore

  constructor(metadataStore: MetadataStore) {
    this.metadataStore = metadataStore
  }

  addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node)
  }

  addEdge(edge: KnowledgeEdge): void {
    this.edges.push(edge)
    const fromNode = this.nodes.get(edge.from)
    if (fromNode && !fromNode.connections.includes(edge.to)) {
      fromNode.connections.push(edge.to)
    }
  }

  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id)
  }

  getConnectedNodes(id: string): KnowledgeNode[] {
    const node = this.nodes.get(id)
    if (!node) return []
    return node.connections
      .map((connId) => this.nodes.get(connId))
      .filter(Boolean) as KnowledgeNode[]
  }

  findNodesByType(type: KnowledgeNode['type']): KnowledgeNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type)
  }

  searchNodes(query: string): KnowledgeNode[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.nodes.values()).filter((node) => {
      const dataStr = JSON.stringify(node.data).toLowerCase()
      return dataStr.includes(lowerQuery)
    })
  }

  buildFromCache(): void {
    const cachedCommits = this.metadataStore.getAllRepos()

    for (const repo of cachedCommits) {
      const repoNode: KnowledgeNode = {
        id: repo.id,
        type: 'branch',
        data: { path: repo.path, branch: repo.branch },
        connections: [],
      }
      this.addNode(repoNode)
    }

    logger.info(`Knowledge graph built: ${this.nodes.size} nodes, ${this.edges.length} edges`)
  }

  getStats(): { nodes: number; edges: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {}
    for (const node of this.nodes.values()) {
      byType[node.type] = (byType[node.type] || 0) + 1
    }
    return {
      nodes: this.nodes.size,
      edges: this.edges.length,
      byType,
    }
  }
}

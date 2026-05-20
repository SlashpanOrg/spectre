import React from 'react'
import { Box, Text } from 'ink'
import { TextInput, Spinner } from '@inkjs/ui'
import { QueryEngine, QueryResult } from '../../core/query-engine.js'
import { VectorStore } from '../../storage/vector-store.js'
import { MetadataStore } from '../../storage/metadata-store.js'
import { KnowledgeGraph } from '../../core/knowledge-graph.js'
import { loadConfig } from '../../utils/config.js'
import { EvidenceItem } from '../../core/knowledge-graph.js'

interface QueryPanelProps {
  initialQuery?: string
}

export function QueryPanel({ initialQuery }: QueryPanelProps) {
  const [query, setQuery] = React.useState(initialQuery || '')
  const [result, setResult] = React.useState<QueryResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [history, setHistory] = React.useState<Array<{ query: string; result: QueryResult }>>([])

  const engineRef = React.useRef<QueryEngine | null>(null)

  async function runQuery(question: string) {
    if (!question.trim()) return

    setLoading(true)
    setError('')
    setQuery(question)

    try {
      if (!engineRef.current) {
        const config = loadConfig()
        const vectorStore = new VectorStore(config.qdrantUrl)
        const metadataStore = new MetadataStore(config.dbPath)
        const knowledgeGraph = new KnowledgeGraph(metadataStore)
        knowledgeGraph.buildFromCache()

        engineRef.current = new QueryEngine(vectorStore, metadataStore, knowledgeGraph)
      }

      const queryResult = await engineRef.current.query(question)
      setResult(queryResult)
      setHistory((prev) => [...prev, { query: question, result: queryResult }])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (initialQuery) {
      runQuery(initialQuery)
    }
  }, [initialQuery])

  return (
    <Box flexDirection="column" padding={1} width={80}>
      <Text bold color="cyan">
        Spectre Query
      </Text>
      <Text dimColor>Ask questions about your codebase history and decisions</Text>

      <Box marginTop={1}>
        <Text bold color="green">
          {'> '}
        </Text>
        <TextInput
          defaultValue={query}
          placeholder="Why did we choose X over Y?"
          onSubmit={runQuery}
        />
      </Box>

      {loading && (
        <Box marginTop={1}>
          <Spinner label="Searching knowledge graph..." />
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      {result && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">
            Answer:
          </Text>
          <Text>{result.answer}</Text>

          <Box marginTop={1}>
            <Text bold>Confidence: {(result.confidence * 100).toFixed(0)}%</Text>
          </Box>

          {result.evidence.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text bold underline>
                Evidence:
              </Text>
              {result.evidence.slice(0, 5).map((ev: EvidenceItem, i: number) => (
                <Box key={i} flexDirection="column" paddingLeft={2}>
                  <Text dimColor>
                    [{ev.type}] {ev.hash?.substring(0, 7)} by {ev.author} ({ev.date})
                  </Text>
                  <Text>{ev.message}</Text>
                </Box>
              ))}
            </Box>
          )}

          {result.sources.length > 0 && (
            <Box marginTop={1}>
              <Text dimColor>Sources: {result.sources.length} commits analyzed</Text>
            </Box>
          )}
        </Box>
      )}

      {history.length > 1 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold underline>
            Recent Queries:
          </Text>
          {history.slice(-3).map((h, i) => (
            <Text key={i} dimColor>
              • {h.query.substring(0, 60)}
              {h.query.length > 60 ? '...' : ''}
            </Text>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press Esc to exit</Text>
      </Box>
    </Box>
  )
}

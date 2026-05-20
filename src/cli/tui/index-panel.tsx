import React from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
import { IndexingPipeline } from '../../core/indexing-pipeline.js'
import { IndexProgress } from '../../core/indexer.js'
import { logger } from '../../utils/logger.js'

interface IndexPanelProps {
  repoPath: string
  forceFull: boolean
}

export function IndexPanel({ repoPath, forceFull }: IndexPanelProps) {
  const [status, setStatus] = React.useState<'checking' | 'indexing' | 'complete' | 'error'>(
    'checking',
  )
  const [progress, setProgress] = React.useState<IndexProgress>({
    total: 0,
    current: 0,
    percentage: 0,
  })
  const [result, setResult] = React.useState<{
    indexed: number
    skipped: number
    duration: number
  } | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function runIndex() {
      try {
        setStatus('indexing')
        const pipeline = new IndexingPipeline(repoPath)

        const indexResult = await pipeline.index(forceFull, (p: IndexProgress) => {
          setProgress(p)
        })

        pipeline.close()

        setResult({
          indexed: indexResult.indexedCommits,
          skipped: indexResult.skippedCommits,
          duration: indexResult.duration,
        })
        setStatus('complete')

        if (indexResult.errors.length > 0) {
          logger.warn('Indexing errors:', indexResult.errors)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    }

    runIndex()
  }, [repoPath, forceFull])

  if (status === 'checking') {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Checking repository..." />
      </Box>
    )
  }

  if (status === 'indexing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">
          Indexing Repository
        </Text>
        <Box marginTop={1}>
          <Spinner label={`Processing commit ${progress.current}/${progress.total}`} />
        </Box>
        <Box marginTop={1}>
          <Text>{progress.percentage}% complete</Text>
        </Box>
        {progress.currentCommit && <Text dimColor>Current: {progress.currentCommit}</Text>}
      </Box>
    )
  }

  if (status === 'complete' && result) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="green">
          Indexing Complete!
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Indexed: {result.indexed} commits</Text>
          <Text>Skipped: {result.skipped} commits</Text>
          <Text>Duration: {(result.duration / 1000).toFixed(1)}s</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Run `spectre query "your question"` to explore your codebase.</Text>
        </Box>
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">
          Indexing Failed
        </Text>
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      </Box>
    )
  }

  return null
}

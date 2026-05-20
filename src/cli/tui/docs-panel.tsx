import React from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
import { DocGenerator, GeneratedDoc, DocType } from '../../core/doc-generator.js'

interface DocsPanelProps {
  repoPath: string
  docType: DocType
}

export function DocsPanel({ repoPath, docType }: DocsPanelProps) {
  const [status, setStatus] = React.useState<'loading' | 'complete' | 'error'>('loading')
  const [doc, setDoc] = React.useState<GeneratedDoc | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function runGeneration() {
      try {
        const generator = new DocGenerator(repoPath)
        const generatedDoc = await generator.generate(docType)
        setDoc(generatedDoc)
        setStatus('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    }
    runGeneration()
  }, [repoPath, docType])

  if (status === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label={`Generating ${docType}...`} />
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">
          Generation Failed
        </Text>
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      </Box>
    )
  }

  if (!doc) return null

  return (
    <Box flexDirection="column" padding={1} width={80}>
      <Text bold color="cyan">
        {doc.title} Generated
      </Text>

      <Box marginTop={1}>
        <Text dimColor>Generated: {new Date(doc.generatedAt).toLocaleString()}</Text>
      </Box>
      <Box>
        <Text dimColor>Based on: {doc.metadata.commitCount as number} commits</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold underline>
          Preview:
        </Text>
        {doc.content
          .split('\n')
          .slice(0, 30)
          .map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        {doc.content.split('\n').length > 30 && (
          <Text dimColor>... ({doc.content.split('\n').length - 30} more lines)</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Full content: {doc.content.length} characters</Text>
      </Box>
    </Box>
  )
}

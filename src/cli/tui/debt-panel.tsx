import React from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
import { DebtDetector, DebtReport, DebtPattern } from '../../core/debt-detector.js'

interface DebtPanelProps {
  repoPath: string
}

export function DebtPanel({ repoPath }: DebtPanelProps) {
  const [status, setStatus] = React.useState<'loading' | 'complete' | 'error'>('loading')
  const [report, setReport] = React.useState<DebtReport | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function runAnalysis() {
      try {
        const detector = new DebtDetector(repoPath)
        const debtReport = await detector.analyze()
        setReport(debtReport)
        setStatus('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    }
    runAnalysis()
  }, [repoPath])

  if (status === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Analyzing technical debt..." />
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">
          Analysis Failed
        </Text>
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      </Box>
    )
  }

  if (!report) return null

  const healthColor =
    report.overallHealth >= 7 ? 'green' : report.overallHealth >= 5 ? 'yellow' : 'red'

  return (
    <Box flexDirection="column" padding={1} width={80}>
      <Text bold color="cyan">
        Technical Debt Report
      </Text>

      <Box marginTop={1}>
        <Text bold>Overall Health: </Text>
        <Text bold color={healthColor}>
          {report.overallHealth}/10
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text>Patterns found: {report.totalPatterns}</Text>
      </Box>

      {Object.keys(report.bySeverity).length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold underline>
            By Severity:
          </Text>
          {Object.entries(report.bySeverity).map(([sev, count]) => {
            const color = sev === 'high' ? 'red' : sev === 'medium' ? 'yellow' : 'cyan'
            return (
              <Text key={sev}>
                <Text color={color}>{sev.toUpperCase()}:</Text> {count}
              </Text>
            )
          })}
        </Box>
      )}

      {Object.keys(report.byType).length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold underline>
            By Type:
          </Text>
          {Object.entries(report.byType).map(([type, count]) => (
            <Text key={type}>
              {type}: {count}
            </Text>
          ))}
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold underline>
          Patterns:
        </Text>
        {report.patterns.slice(0, 8).map((pattern: DebtPattern, i: number) => {
          const sevColor =
            pattern.severity === 'high' ? 'red' : pattern.severity === 'medium' ? 'yellow' : 'cyan'
          return (
            <Box key={i} flexDirection="column" paddingLeft={2} marginTop={1}>
              <Text>
                <Text bold color={sevColor}>
                  [{pattern.severity.toUpperCase()}]
                </Text>{' '}
                <Text dimColor>[{pattern.type}]</Text> <Text dimColor>({pattern.trend})</Text>
              </Text>
              <Text>{pattern.description}</Text>
              <Text dimColor>
                Files: {pattern.files.slice(0, 3).join(', ')}
                {pattern.files.length > 3 ? '...' : ''}
              </Text>
              <Text dimColor>Fix: {pattern.recommendation}</Text>
            </Box>
          )
        })}
        {report.patterns.length > 8 && (
          <Text dimColor>... and {report.patterns.length - 8} more patterns</Text>
        )}
      </Box>

      {report.summary && (
        <Box marginTop={1}>
          <Text bold>Summary: </Text>
          <Text>{report.summary}</Text>
        </Box>
      )}
    </Box>
  )
}

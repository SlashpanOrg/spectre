import React from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
import { PRReviewer, PRReviewResult, ReviewComment } from '../../core/pr-reviewer.js'

interface ReviewPanelProps {
  repoPath: string
  baseBranch: string
}

export function ReviewPanel({ repoPath, baseBranch }: ReviewPanelProps) {
  const [status, setStatus] = React.useState<'loading' | 'complete' | 'error'>('loading')
  const [result, setResult] = React.useState<PRReviewResult | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function runReview() {
      try {
        const reviewer = new PRReviewer(repoPath)
        const reviewResult = await reviewer.review(baseBranch)
        setResult(reviewResult)
        setStatus('complete')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      }
    }
    runReview()
  }, [repoPath, baseBranch])

  if (status === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="Analyzing pull request..." />
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">
          Review Failed
        </Text>
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      </Box>
    )
  }

  if (!result) return null

  const scoreColor =
    result.overallScore >= 7 ? 'green' : result.overallScore >= 5 ? 'yellow' : 'red'

  return (
    <Box flexDirection="column" padding={1} width={80}>
      <Text bold color="cyan">
        PR Review Complete
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Summary:</Text>
        <Text>{result.summary}</Text>

        <Box marginTop={1}>
          <Text bold>Overall Score: </Text>
          <Text bold color={scoreColor}>
            {result.overallScore}/10
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold underline>
            Comments ({result.comments.length}):
          </Text>
          {result.comments.slice(0, 10).map((comment: ReviewComment, i: number) => {
            const severityColor =
              comment.severity === 'critical'
                ? 'red'
                : comment.severity === 'warning'
                  ? 'yellow'
                  : 'cyan'
            return (
              <Box key={i} flexDirection="column" paddingLeft={2} marginTop={1}>
                <Text>
                  <Text bold color={severityColor}>
                    [{comment.severity.toUpperCase()}]
                  </Text>{' '}
                  <Text dimColor>[{comment.category}]</Text> <Text dimColor>{comment.file}</Text>
                </Text>
                <Text>{comment.message}</Text>
                {comment.suggestion && <Text dimColor>Suggestion: {comment.suggestion}</Text>}
              </Box>
            )
          })}
          {result.comments.length > 10 && (
            <Text dimColor>... and {result.comments.length - 10} more comments</Text>
          )}
        </Box>
      </Box>
    </Box>
  )
}

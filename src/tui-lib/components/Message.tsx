import React from 'react'
import { Box, Text } from 'ink'
import { MessageProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'
import { CodeBlock } from './CodeBlock.js'

export function Message({ message, theme = defaultTheme }: MessageProps) {
  const colors = theme.colors
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <Box paddingX={2} paddingY={0}>
        <Text color={colors.textMuted} dimColor>
          {message.content}
        </Text>
      </Box>
    )
  }

  const contentParts = message.content.split(/```(\w*)\n([\s\S]*?)```/g)

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={0}>
        {isUser ? (
          <Text bold color={colors.primary}>
            You
          </Text>
        ) : (
          <Text bold color={colors.success}>
            AI
          </Text>
        )}
        {message.isStreaming && (
          <Text color={colors.warning}>
            {' '}
            ⠋
          </Text>
        )}
      </Box>

      <Box flexDirection="column">
        {contentParts.map((part, i) => {
          if (i % 3 === 0 && part.trim()) {
            return (
              <Text key={i} color={colors.text} wrap="wrap">
                {part}
              </Text>
            )
          }
          if (i % 3 === 1) {
            return null
          }
          if (i % 3 === 2) {
            const lang = contentParts[i - 1] || 'typescript'
            return <CodeBlock key={i} code={part.trim()} language={lang} theme={theme} />
          }
          return null
        })}
      </Box>
    </Box>
  )
}

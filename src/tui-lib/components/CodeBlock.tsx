import React from 'react'
import { Box, Text } from 'ink'
import { CodeBlockProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'
import { highlightCode } from '../utils/syntax.js'

export function CodeBlock({
  code,
  language = 'typescript',
  theme = defaultTheme,
}: CodeBlockProps) {
  const colors = theme.colors
  const lines = code.split('\n')
  const maxLineNum = lines.length.toString().length

  return (
    <Box flexDirection="column" marginY={1}>
      {language && (
        <Box paddingX={1}>
          <Text bold color={colors.info} backgroundColor={colors.codeBackground}>
            {' '}
            {language}{' '}
          </Text>
        </Box>
      )}
      <Box flexDirection="column" paddingX={1}>
        {lines.map((line, i) => {
          const lineNum = String(i + 1).padStart(maxLineNum, ' ')
          const highlighted = highlightCode(line, language, theme)
          return (
            <Box key={i}>
              <Text color={colors.textMuted} dimColor>
                {lineNum}{' '}
              </Text>
              <Text>{highlighted}</Text>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

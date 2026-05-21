import React from 'react'
import { Box, Text } from 'ink'
import { StatusBarProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'

export function StatusBar({
  provider,
  model,
  shortcuts,
  status = 'idle',
  theme = defaultTheme,
}: StatusBarProps) {
  const colors = theme.colors

  const statusIndicator = (() => {
    switch (status) {
      case 'loading':
        return <Text color={colors.warning}>⠋</Text>
      case 'streaming':
        return <Text color={colors.success}>●</Text>
      case 'error':
        return <Text color={colors.error}>✗</Text>
      default:
        return <Text color={colors.textMuted}>○</Text>
    }
  })()

  const statusLabel = (() => {
    switch (status) {
      case 'loading':
        return 'Loading...'
      case 'streaming':
        return 'Streaming'
      case 'error':
        return 'Error'
      default:
        return 'Ready'
    }
  })()

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingX={2}
      paddingY={0}
      borderStyle="single"
      borderColor={colors.border}
    >
      <Box gap={2}>
        {statusIndicator}
        <Text color={colors.textMuted}>{statusLabel}</Text>
        {provider !== 'none' && provider !== '' && (
          <>
            <Text color={colors.border}>│</Text>
            <Text color={colors.textMuted}>
              {provider}
            </Text>
            <Text color={colors.textMuted}>/</Text>
            <Text color={colors.textMuted}>
              {model || 'none'}
            </Text>
          </>
        )}
      </Box>

      <Box gap={2}>
        {shortcuts.map((s, i) => (
          <Box key={i} gap={0}>
            <Text bold color={colors.highlight}>
              {s.key}
            </Text>
            <Text color={colors.textMuted}>
              {' '}
              {s.action}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

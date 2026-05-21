import React from 'react'
import { Box, Text } from 'ink'
import { HeaderProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'

export function Header({
  title,
  subtitle,
  version,
  provider,
  model,
  theme = defaultTheme,
}: HeaderProps) {
  const colors = theme.colors

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingX={2}
      paddingY={1}
      borderStyle="single"
      borderColor={colors.border}
    >
      <Box flexDirection="column">
        <Box>
          <Text bold color={colors.primary}>
            {title}
          </Text>
          {version && <Text color={colors.textMuted}> v{version}</Text>}
        </Box>
        {subtitle && (
          <Text color={colors.textMuted} dimColor>
            {subtitle}
          </Text>
        )}
      </Box>

      <Box flexDirection="column" alignItems="flex-end">
        {provider && (
          <Box>
            <Text color={colors.textMuted}>Provider: </Text>
            <Text bold color={colors.success}>
              {provider}
            </Text>
          </Box>
        )}
        {model && (
          <Box>
            <Text color={colors.textMuted}>Model: </Text>
            <Text bold color={colors.info}>
              {model}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

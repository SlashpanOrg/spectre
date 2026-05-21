import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { ProgressIndicatorProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'
import { createProgressBar } from '../utils/colors.js'

export function ProgressIndicator({
  current,
  total,
  label,
  step,
  visible,
  theme = defaultTheme,
}: ProgressIndicatorProps) {
  const [spinnerFrame, setSpinnerFrame] = useState(0)
  const colors = theme.colors
  const symbols = theme.symbols

  useEffect(() => {
    if (!visible) return

    const interval = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % symbols.spinner.length)
    }, 100)

    return () => clearInterval(interval)
  }, [visible, symbols.spinner.length])

  if (!visible) return null

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const bar = createProgressBar(current, total, 30)

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {label && (
        <Box>
          <Text color={colors.warning}>{symbols.spinner[spinnerFrame]} </Text>
          <Text bold color={colors.text}>
            {label}
          </Text>
          <Text color={colors.textMuted}> ({percentage}%)</Text>
        </Box>
      )}

      <Box paddingX={1}>
        <Text color={colors.text}>{bar}</Text>
      </Box>

      {step && (
        <Box paddingX={1}>
          <Text color={colors.textMuted} dimColor>
            {step}
          </Text>
        </Box>
      )}
    </Box>
  )
}

import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { SpinnerProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'

export function Spinner({ label, visible = true, theme = defaultTheme }: SpinnerProps) {
  const [frame, setFrame] = useState(0)
  const symbols = theme.symbols

  useEffect(() => {
    if (!visible) return

    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % symbols.spinner.length)
    }, 100)

    return () => clearInterval(interval)
  }, [visible, symbols.spinner.length])

  if (!visible) return null

  return (
    <Box>
      <Text color={theme.colors.warning}>{symbols.spinner[frame]} </Text>
      {label && <Text color={theme.colors.text}>{label}</Text>}
    </Box>
  )
}

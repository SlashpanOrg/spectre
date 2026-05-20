import React from 'react'
import { Box, Text, useApp } from 'ink'
import { ASCII_ART, TAGLINE, BUILT_BY, CONTACT_EMAIL, GITHUB_URL } from '../../utils/branding.js'

interface IntroScreenProps {
  directory?: string
}

export function IntroScreen({ directory = '.' }: IntroScreenProps) {
  const { exit } = useApp()

  React.useEffect(() => {
    const timer = setTimeout(() => {
      exit()
    }, 3000)
    return () => clearTimeout(timer)
  }, [exit])

  return (
    <Box flexDirection="column" alignItems="center" padding={1}>
      <Text>{ASCII_ART}</Text>
      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text bold color="cyan">
          {TAGLINE}
        </Text>
        <Text dimColor>{'─'.repeat(40)}</Text>
        <Text dimColor>{BUILT_BY}</Text>
        <Text dimColor>
          {CONTACT_EMAIL} | {GITHUB_URL}
        </Text>
        {directory && (
          <Box marginTop={1}>
            <Text dimColor>Initializing in: {directory}</Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

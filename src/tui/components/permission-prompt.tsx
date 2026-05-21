import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'

interface PermissionPromptProps {
  tool: string
  pattern: string
  description: string
  onAllowOnce: () => void
  onAllowAlways: () => void
  onDecline: () => void
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  tool,
  pattern,
  description,
  onAllowOnce,
  onAllowAlways,
  onDecline,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const options = [
    { label: 'Allow Once', action: onAllowOnce, color: 'yellow' as const },
    { label: 'Allow Always', action: onAllowAlways, color: 'green' as const },
    { label: 'Decline', action: onDecline, color: 'red' as const },
  ]

  useInput(
    (input, key) => {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(options.length - 1, prev + 1))
      } else if (key.return) {
        options[selectedIndex].action()
      }
    },
    { isActive: true },
  )

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} borderStyle="round" borderColor="yellow">
      <Box marginBottom={1}>
        <Text bold color="yellow">⚠️  Permission Required</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text>Tool: <Text bold color="cyan">{tool}</Text></Text>
        {pattern && <Text>Pattern: <Text bold>{pattern}</Text></Text>}
        {description && <Text dimColor>{description}</Text>}
      </Box>

      <Box flexDirection="column">
        {options.map((option, i) => (
          <Box key={option.label}>
            <Text color={i === selectedIndex ? option.color : 'gray'}>
              {i === selectedIndex ? '▸ ' : '  '}
            </Text>
            <Text bold color={i === selectedIndex ? option.color : 'white'}>
              {option.label}
            </Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓: navigate | Enter: select</Text>
      </Box>
    </Box>
  )
}

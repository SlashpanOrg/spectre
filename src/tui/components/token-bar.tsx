import React from 'react'
import { Box, Text } from 'ink'

interface TokenBarProps {
  usedTokens: number
  totalTokens: number
  contextWindow: number
  showPercentage?: boolean
}

export const TokenBar: React.FC<TokenBarProps> = ({
  usedTokens,
  totalTokens,
  contextWindow,
  showPercentage = true,
}) => {
  const percentage = contextWindow > 0 ? Math.min(100, Math.round((totalTokens / contextWindow) * 100)) : 0
  const barWidth = 20
  const filledWidth = Math.round((percentage / 100) * barWidth)
  const emptyWidth = barWidth - filledWidth

  const isWarning = percentage >= 80
  const isCritical = percentage >= 95

  const barColor = isCritical ? 'red' : isWarning ? 'yellow' : 'green'
  const filledChar = '█'
  const emptyChar = '░'

  const bar = filledChar.repeat(filledWidth) + emptyChar.repeat(emptyWidth)

  return (
    <Box>
      <Text color="gray">Tokens:</Text>
      <Text color={barColor}> {bar} </Text>
      {showPercentage && (
        <Text bold color={barColor}>
          {percentage}%
        </Text>
      )}
      <Text color="gray">
        {' '}
        ({usedTokens.toLocaleString()}/{contextWindow.toLocaleString()})
      </Text>
    </Box>
  )
}

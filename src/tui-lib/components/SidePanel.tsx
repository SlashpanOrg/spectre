import React from 'react'
import { Box, Text } from 'ink'
import { SidePanelProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'

export function SidePanel({
  title,
  sections,
  visible = true,
  theme = defaultTheme,
}: SidePanelProps) {
  const colors = theme.colors

  if (!visible) return null

  const statusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return colors.success
      case 'warning':
        return colors.warning
      case 'error':
        return colors.error
      case 'info':
        return colors.info
      default:
        return colors.textMuted
    }
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} width="100%">
      <Text bold color={colors.primary}>
        {title}
      </Text>
      <Text color={colors.border}>
        {'─'.repeat(Math.max(10, title.length))}
      </Text>

      {sections.map((section, si) => (
        <Box key={si} flexDirection="column" marginTop={1}>
          <Text bold color={colors.textMuted}>
            {section.title}
          </Text>
          {section.items.map((item, ii) => (
            <Box key={ii} flexDirection="row" justifyContent="space-between">
              <Text color={colors.text}>
                {item.label}
              </Text>
              {item.value && (
                <Text color={statusColor(item.status)}>
                  {item.value}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}

import React, { useState, useMemo, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { CommandPaletteProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'
import { fuzzyFilter } from '../utils/fuzzy.js'

export function CommandPalette({
  commands,
  onSelect,
  onClose,
  visible,
  theme = defaultTheme,
}: CommandPaletteProps) {
  const [filter, setFilter] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const colors = theme.colors

  const filteredCommands = useMemo(() => {
    if (!filter.trim()) return commands
    return fuzzyFilter(commands, filter, (cmd) => `${cmd.name} ${cmd.description}`).map(
      (f) => f.item,
    )
  }, [commands, filter])

  const handleSelect = useCallback(() => {
    if (filteredCommands[selectedIndex]) {
      onSelect(filteredCommands[selectedIndex])
    }
  }, [selectedIndex, filteredCommands, onSelect])

  useInput(
    (input, key) => {
      if (key.escape) {
        onClose()
        return
      }

      if (key.return) {
        handleSelect()
        return
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
        return
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(filteredCommands.length - 1, prev + 1))
        return
      }

      if (key.backspace) {
        setFilter((prev) => prev.slice(0, -1))
        setSelectedIndex(0)
        return
      }

      if (input.length === 1 && !key.ctrl && !key.meta) {
        setFilter((prev) => prev + input)
        setSelectedIndex(0)
        return
      }
    },
    { isActive: visible },
  )

  if (!visible) return null

  const maxVisible = 10
  const visibleCommands = filteredCommands.slice(0, maxVisible)

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.primary}
      paddingX={1}
      paddingY={1}
      marginX={4}
      marginY={2}
    >
      <Box paddingX={1} marginBottom={1}>
        <Text bold color={colors.primary}>
          Command Palette
        </Text>
        <Text color={colors.textMuted}>
          {' '}
          ({filteredCommands.length} commands)
        </Text>
      </Box>

      <Box paddingX={2} marginBottom={1}>
        <Text color={colors.highlight}>
          {`>`}{' '}
        </Text>
        <Text color={colors.text} bold>
          {filter}
        </Text>
      </Box>

      <Box flexDirection="column">
        {visibleCommands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex
          return (
            <Box key={cmd.id} paddingX={1}>
              <Text color={isSelected ? colors.highlight : colors.text}>
                {isSelected ? '▸ ' : '  '}
              </Text>
              <Text bold color={isSelected ? colors.highlight : colors.text}>
                {cmd.name}
              </Text>
              <Text color={colors.textMuted}>
                {' '}
                - {cmd.description}
              </Text>
              {cmd.shortcut && (
                <Text color={colors.info} dimColor>
                  {' '}
                  [{cmd.shortcut}]
                </Text>
              )}
            </Box>
          )
        })}
      </Box>

      <Box paddingX={2} marginTop={1}>
        <Text color={colors.textMuted} dimColor>
          ↑↓: navigate | Enter: execute | Esc: close
        </Text>
      </Box>
    </Box>
  )
}

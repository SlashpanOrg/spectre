import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { TextInputProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'

export function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  suggestions = [],
  autoFocus = true,
  theme = defaultTheme,
}: TextInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const colors = theme.colors

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase()),
  )

  useInput(
    (input, key) => {
      if (key.return) {
        if (showSuggestions && filteredSuggestions.length > 0) {
          onChange(filteredSuggestions[suggestionIndex])
          onSubmit(filteredSuggestions[suggestionIndex])
        } else {
          onSubmit(value)
        }
        setShowSuggestions(false)
        return
      }

      if (key.tab) {
        if (filteredSuggestions.length > 0) {
          onChange(filteredSuggestions[suggestionIndex])
          setSuggestionIndex((prev) => (prev + 1) % filteredSuggestions.length)
        }
        return
      }

      if (key.upArrow) {
        if (showSuggestions) {
          setSuggestionIndex((prev) => Math.max(0, prev - 1))
        }
        return
      }

      if (key.downArrow) {
        if (showSuggestions) {
          setSuggestionIndex((prev) => Math.min(filteredSuggestions.length - 1, prev + 1))
        }
        return
      }

      if (key.backspace) {
        onChange(value.slice(0, -1))
        setShowSuggestions(false)
        return
      }

      if (key.escape) {
        setShowSuggestions(false)
        return
      }

      if (input.length === 1 && !key.ctrl && !key.meta) {
        const newValue = value + input
        onChange(newValue)
        setShowSuggestions(suggestions.length > 0)
        setSuggestionIndex(0)
        return
      }
    },
    { isActive: autoFocus },
  )

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors.highlight}>{'>'} </Text>
        <Text color={colors.text}>
          {value || (placeholder && <Text dimColor>{placeholder}</Text>)}
        </Text>
      </Box>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Box flexDirection="column" marginLeft={2}>
          {filteredSuggestions.slice(0, 5).map((s, i) => (
            <Text key={i} color={i === suggestionIndex ? colors.highlight : colors.textMuted}>
              {i === suggestionIndex ? '▸ ' : '  '}
              {s}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  )
}

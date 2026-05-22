import React, { useState, useCallback, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { TextInput } from '@inkjs/ui'
import { defaultTheme } from '../../tui-lib/index.js'

interface SuggestionItem {
  label: string
  description: string
}

interface AutocompleteInputProps {
  placeholder?: string
  isDisabled?: boolean
  suggestions: SuggestionItem[]
  onSubmit: (value: string) => void
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  placeholder = '',
  isDisabled = false,
  suggestions,
  onSubmit,
}) => {
  const colors = defaultTheme.colors
  const [inputValue, setInputValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(0)
  const submittingRef = useRef(false)

  const filtered = suggestions.filter((s) =>
    inputValue ? s.label.toLowerCase().startsWith(inputValue.toLowerCase()) : false,
  )
  const isSuggesting = showSuggestions && filtered.length > 0 && !isDisabled

  const resetSuggestions = useCallback(() => {
    setShowSuggestions(false)
    setSelectedIndex(0)
  }, [])

  useInput(
    (input, key) => {
      if (!showSuggestions || filtered.length === 0 || isDisabled) {
        if (key.tab && !key.return) {
          const firstMatch = suggestions.find((s) =>
            inputValue ? s.label.toLowerCase().startsWith(inputValue.toLowerCase()) : false,
          )
          if (firstMatch) {
            setInputValue(firstMatch.label)
            resetSuggestions()
          }
        }
        return
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
        return
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
        return
      }

      if (key.return || key.tab) {
        const selected = filtered[selectedIndex]
        if (selected) {
          submittingRef.current = true
          resetSuggestions()
          setInputValue('')
          inputRef.current++
          onSubmit(selected.label)
        }
        return
      }

      if (key.escape) {
        resetSuggestions()
        return
      }
    },
    { isActive: !isDisabled },
  )

  const handleChange = useCallback(
    (value: string) => {
      setInputValue(value)
      if (value.startsWith('/') && value.length > 1) {
        const hasMatch = suggestions.some((s) => s.label.toLowerCase().startsWith(value.toLowerCase()))
        setShowSuggestions(hasMatch)
        setSelectedIndex(0)
      } else {
        setShowSuggestions(false)
      }
    },
    [suggestions],
  )

  const handleSubmit = useCallback(
    (value: string) => {
      if (submittingRef.current) {
        submittingRef.current = false
        return
      }
      resetSuggestions()
      setInputValue('')
      inputRef.current++
      onSubmit(value)
    },
    [onSubmit, resetSuggestions],
  )

  const suggestionTexts = filtered.map((s) => s.label)

  return (
    <Box flexDirection="column" flexGrow={1}>
      {isSuggesting && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.info}
          paddingX={1}
          marginBottom={0}
        >
          {filtered.map((s, i) => (
            <Box key={s.label}>
              <Text
                bold={i === selectedIndex}
                color={i === selectedIndex ? colors.primary : colors.text}
                inverse={i === selectedIndex}
              >
                {i === selectedIndex ? '❯ ' : '  '}
                {s.label}
              </Text>
              <Text color={colors.textMuted} dimColor>
                {' '}— {s.description}
              </Text>
            </Box>
          ))}
        </Box>
      )}
      <TextInput
        key={inputRef.current}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        isDisabled={isDisabled}
        suggestions={suggestionTexts}
        onChange={handleChange}
      />
    </Box>
  )
}

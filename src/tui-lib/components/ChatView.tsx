import React, { useState, useRef, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { ChatViewProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'
import { Message } from './Message.js'

export function ChatView({
  messages,
  isStreaming = false,
  onSend,
  onCancel,
  theme = defaultTheme,
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef(0)
  const colors = theme.colors

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSend(inputValue.trim())
      setInputValue('')
    }
  }

  useInput(
    (input, key) => {
      if (key.escape) {
        onCancel?.()
        return
      }

      if (key.return) {
        handleSubmit()
        return
      }

      if (key.backspace) {
        setInputValue((prev) => prev.slice(0, -1))
        return
      }

      if (input.length === 1 && !key.ctrl && !key.meta) {
        setInputValue((prev) => prev + input)
        return
      }
    },
    { isActive: true },
  )

  useEffect(() => {
    scrollRef.current = messages.length
  }, [messages])

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="column" flexGrow={1}>
        {messages.length === 0 && (
          <Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color={colors.textMuted} dimColor>
              Start a conversation...
            </Text>
          </Box>
        )}

        {messages.map((msg) => (
          <Message key={msg.id} message={msg} theme={theme} />
        ))}
      </Box>

      <Box
        paddingX={2}
        paddingY={1}
        borderStyle="single"
        borderColor={isStreaming ? colors.warning : colors.border}
      >
        <Text color={colors.highlight}>{'>'} </Text>
        <Text color={colors.text}>{inputValue}</Text>
        {isStreaming && <Text color={colors.warning}> │ Ctrl+C to cancel</Text>}
      </Box>
    </Box>
  )
}

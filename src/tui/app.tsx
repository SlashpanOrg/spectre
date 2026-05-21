import React, { useState, useCallback } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { TextInput } from '@inkjs/ui'
import { WELCOME_MESSAGE } from '../utils/branding.js'
import { CommandParser } from '../commands/parser.js'
import { getActiveProvider } from '../utils/config.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { AgentOrchestrator, AgentTask } from '../agent/orchestrator.js'
import { logger } from '../utils/logger.js'

interface Message {
  id: string
  type: 'user' | 'system' | 'tool' | 'error' | 'welcome'
  content: string
  timestamp: Date
}

interface SpectreAppProps {
  parser: CommandParser
}

export const SpectreApp: React.FC<SpectreAppProps> = ({ parser }) => {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'welcome',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
    {
      id: 'hint',
      type: 'system',
      content: 'Type /help for available commands or just ask a question.',
      timestamp: new Date(),
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProvider, setCurrentProvider] = useState(() => {
    const active = getActiveProvider()
    return active ? `${active.name}:${active.model}` : 'none'
  })
  const [orchestrator] = useState(() => new AgentOrchestrator(getProvider()))

  const addMessage = useCallback((type: Message['type'], content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: new Date(),
      },
    ])
  }, [])

  const updateProviderStatus = useCallback(() => {
    const active = getActiveProvider()
    setCurrentProvider(active ? `${active.name}:${active.model}` : 'none')
  }, [])

  const handleCommand = useCallback(
    async (input: string) => {
      setIsProcessing(true)
      addMessage('user', input)

      try {
        const result = await parser.execute(input)

        if (result === '__QUIT__') {
          addMessage('system', 'Goodbye!')
          setTimeout(() => exit(), 500)
          return
        }

        if (result === '__WIZARD__') {
          addMessage(
            'system',
            'Setup wizard: Run with API key configuration.\nConfigure providers: openai, anthropic, gemini, ollama',
          )
          updateProviderStatus()
          setIsProcessing(false)
          return
        }

        if (result === '__HELP__') {
          addMessage('tool', parser.getHelp())
          setIsProcessing(false)
          return
        }

        if (result) {
          addMessage('tool', result)
        } else {
          await handleAgentQuery(input)
          return
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Error: ${msg}`)
        logger.error('Command execution failed:', msg)
      }

      updateProviderStatus()
      setIsProcessing(false)
    },
    [parser, addMessage, exit, updateProviderStatus, orchestrator],
  )

  const handleAgentQuery = useCallback(
    async (input: string) => {
      try {
        clearProviderCache()

        addMessage('system', '🤖 Planning...')

        const task = await orchestrator.execute(input, (t: AgentTask) => {
          const completed = t.steps.filter(
            (s: { status: string }) => s.status === 'completed',
          ).length
          const total = t.steps.length
          const current = t.steps.find((s: { status: string }) => s.status === 'running')
          addMessage(
            'system',
            `Progress: ${completed}/${total}${current ? ` - ${current.description}` : ''}`,
          )
        })

        let output = `Agent Task: ${task.status}\n`
        output += `Steps: ${task.steps.filter((s: { status: string }) => s.status === 'completed').length}/${task.steps.length} completed\n\n`

        for (const step of task.steps) {
          const icon = step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '○'
          output += `${icon} ${step.description} (${step.tool})\n`
          if (step.error) output += `   Error: ${step.error}\n`
        }

        if (task.result) {
          output += `\n${task.result}`
        }

        addMessage('tool', output)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Agent failed: ${msg}`)
        logger.error('Agent execution failed:', msg)
      }

      updateProviderStatus()
      setIsProcessing(false)
    },
    [orchestrator, addMessage, updateProviderStatus],
  )

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed || isProcessing) return

      handleCommand(trimmed)
    },
    [isProcessing, handleCommand],
  )

  useInput(
    (input, key) => {
      if (input === 'q' && key.ctrl) {
        addMessage('system', 'Goodbye!')
        setTimeout(() => exit(), 500)
      }
    },
    { isActive: !isProcessing },
  )

  return (
    <Box flexDirection="column" height="100%">
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {messages.map((msg) => (
          <MessageComponent key={msg.id} message={msg} />
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text color="cyan">{isProcessing ? '⏳ ' : '> '}</Text>
          <TextInput
            placeholder={isProcessing ? 'Processing...' : 'Enter command or question...'}
            onSubmit={handleSubmit}
            isDisabled={isProcessing}
          />
        </Box>

        <Box marginTop={1}>
          <Text dimColor>[{currentProvider}]</Text>
          <Text dimColor> | </Text>
          <Text dimColor>Ctrl+Q to quit</Text>
        </Box>
      </Box>
    </Box>
  )
}

const MessageComponent: React.FC<{ message: Message }> = ({ message }) => {
  const colorMap: Record<Message['type'], string> = {
    user: 'green',
    system: 'cyan',
    tool: 'white',
    error: 'red',
    welcome: 'yellow',
  }

  const prefixMap: Record<Message['type'], string> = {
    user: '❯ ',
    system: 'ℹ ',
    tool: '',
    error: '✗ ',
    welcome: '',
  }

  return (
    <Box flexDirection="column" marginTop={message.type === 'welcome' ? 0 : 1}>
      <Text color={colorMap[message.type]}>
        {prefixMap[message.type]}
        {message.content}
      </Text>
    </Box>
  )
}

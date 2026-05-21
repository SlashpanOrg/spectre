import React, { useState, useCallback, useRef } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { TextInput } from '@inkjs/ui'
import { WELCOME_MESSAGE } from '../utils/branding.js'
import { CommandParser } from '../commands/parser.js'
import { getActiveProvider, addProvider, setActiveProvider, encryptKey, Provider } from '../utils/config.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { AgentOrchestrator, AgentTask } from '../agent/orchestrator.js'
import { discoverModels, ModelInfo } from '../ai/model-discovery.js'
import { logger } from '../utils/logger.js'

const PROVIDER_OPTIONS = [
  { name: 'openai', label: 'OpenAI', requiresApiKey: true, defaultModel: 'gpt-4o-mini' },
  { name: 'anthropic', label: 'Anthropic', requiresApiKey: true, defaultModel: 'claude-sonnet-4-20250514' },
  { name: 'gemini', label: 'Google Gemini', requiresApiKey: true, defaultModel: 'gemini-2.5-flash' },
  { name: 'ollama', label: 'Ollama', requiresApiKey: false, defaultModel: 'llama3' },
]

type WizardStep = 'provider' | 'apiKey' | 'ollamaUrl' | 'model' | 'complete'

interface Message {
  id: string
  type: 'user' | 'system' | 'tool' | 'error' | 'welcome' | 'progress'
  content: string
  timestamp: Date
}

interface SpectreAppProps {
  parser: CommandParser
}

export const SpectreApp: React.FC<SpectreAppProps> = ({ parser }) => {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', type: 'welcome', content: WELCOME_MESSAGE, timestamp: new Date() },
    { id: 'hint', type: 'system', content: 'Type /help for available commands or just ask a question.', timestamp: new Date() },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [currentProvider, setCurrentProvider] = useState(() => {
    const active = getActiveProvider()
    return active ? `${active.name}:${active.model}` : 'none'
  })

  const orchestratorRef = useRef<AgentOrchestrator | null>(null)
  const getOrchestrator = useCallback(() => {
    if (!orchestratorRef.current) {
      try {
        orchestratorRef.current = new AgentOrchestrator(getProvider())
      } catch {
        orchestratorRef.current = null
      }
    }
    return orchestratorRef.current
  }, [])

  const addMessage = useCallback((type: Message['type'], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random()}`, type, content, timestamp: new Date() },
    ])
  }, [])

  const updateProviderStatus = useCallback(() => {
    const active = getActiveProvider()
    setCurrentProvider(active ? `${active.name}:${active.model}` : 'none')
    orchestratorRef.current = null
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
          setShowWizard(true)
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
    [parser, addMessage, exit, updateProviderStatus],
  )

  const handleAgentQuery = useCallback(
    async (input: string) => {
      try {
        clearProviderCache()
        const orch = getOrchestrator()
        if (!orch) {
          addMessage('error', 'No AI provider configured. Run /setup to configure one.')
          setIsProcessing(false)
          return
        }

        const streamingMsgId = `msg-${Date.now()}-stream`
        setMessages((prev) => [
          ...prev,
          { id: streamingMsgId, type: 'system', content: 'Planning...', timestamp: new Date() },
        ])

        let fullContent = ''
        const stream = orch.queryStream(input)

        for await (const token of stream) {
          fullContent += token
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: fullContent, type: 'tool' as const }
                : m,
            ),
          )
        }

        if (!fullContent) {
          const task = await orch.execute(input, (t: AgentTask) => {
            const completed = t.steps.filter((s: { status: string }) => s.status === 'completed').length
            const total = t.steps.length
            const current = t.steps.find((s: { status: string }) => s.status === 'running')
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-progress`,
                type: 'progress',
                content: `Step ${completed}/${total}${current ? ` - ${current.description}` : ''}`,
                timestamp: new Date(),
              },
            ])
          })

          let output = `Task: ${task.status}\n`
          output += `Steps: ${task.steps.filter((s: { status: string }) => s.status === 'completed').length}/${task.steps.length} completed\n\n`
          for (const step of task.steps) {
            const icon = step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '○'
            output += `${icon} ${step.description} (${step.tool})\n`
            if (step.error) output += `   Error: ${step.error}\n`
          }
          if (task.result) output += `\n${task.result}`

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: output, type: 'tool' as const }
                : m,
            ),
          )
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Agent failed: ${msg}`)
        logger.error('Agent execution failed:', msg)
      }

      updateProviderStatus()
      setIsProcessing(false)
    },
    [getOrchestrator, addMessage, updateProviderStatus],
  )

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed || isProcessing || showWizard) return
      handleCommand(trimmed)
    },
    [isProcessing, handleCommand, showWizard],
  )

  useInput(
    (input, key) => {
      if (input === 'q' && key.ctrl) {
        addMessage('system', 'Goodbye!')
        setTimeout(() => exit(), 500)
      }
    },
    { isActive: !isProcessing && !showWizard },
  )

  if (showWizard) {
    return <SetupWizard
      onComplete={() => {
        setShowWizard(false)
        updateProviderStatus()
        addMessage('system', 'Provider configured successfully!')
      }}
      onCancel={() => {
        setShowWizard(false)
        setIsProcessing(false)
      }}
    />
  }

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
    progress: 'gray',
  }

  const prefixMap: Record<Message['type'], string> = {
    user: '❯ ',
    system: 'ℹ ',
    tool: '',
    error: '✗ ',
    welcome: '',
    progress: '  ',
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

interface SetupWizardProps {
  onComplete: () => void
  onCancel: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<WizardStep>('provider')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDER_OPTIONS[0] | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [filter, setFilter] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [inputBuffer, setInputBuffer] = useState('')
  const [spinnerFrame, setSpinnerFrame] = useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % 10)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useInput(
    (input, key) => {
      if (key.escape) {
        onCancel()
        return
      }

      if (isLoading) return

      if (step === 'provider') {
        if (key.upArrow) setSelectedIndex((prev) => Math.max(0, prev - 1))
        else if (key.downArrow) setSelectedIndex((prev) => Math.min(PROVIDER_OPTIONS.length - 1, prev + 1))
        else if (key.return) {
          const provider = PROVIDER_OPTIONS[selectedIndex]
          setSelectedProvider(provider)
          if (provider.name === 'ollama') {
            setStep('ollamaUrl')
          } else {
            setStep('apiKey')
          }
        }
      } else if (step === 'apiKey') {
        if (key.return && inputBuffer.trim()) {
          setApiKey(inputBuffer.trim())
          startModelDiscovery()
        } else if (key.backspace) {
          setInputBuffer((prev) => prev.slice(0, -1))
        } else if (input.length === 1 && !key.ctrl && !key.meta) {
          setInputBuffer((prev) => prev + input)
        }
      } else if (step === 'ollamaUrl') {
        if (key.return) {
          setOllamaUrl(inputBuffer.trim() || 'http://localhost:11434')
          startModelDiscovery()
        } else if (key.backspace) {
          setInputBuffer((prev) => prev.slice(0, -1))
        } else if (input.length === 1 && !key.ctrl && !key.meta) {
          setInputBuffer((prev) => prev + input)
        }
      } else if (step === 'model') {
        if (isFiltering) {
          if (key.return) {
            const filtered = getFilteredModels()
            if (filtered.length > 0 && selectedIndex < filtered.length) {
              setSelectedModel(filtered[selectedIndex].id)
              completeSetup()
            }
          } else if (key.escape) {
            setFilter('')
            setIsFiltering(false)
            setSelectedIndex(0)
          } else if (key.backspace) {
            setFilter((prev) => prev.slice(0, -1))
            setSelectedIndex(0)
          } else if (input.length === 1 && !key.ctrl && !key.meta) {
            setFilter((prev) => prev + input)
            setSelectedIndex(0)
          }
        } else {
          const filtered = getFilteredModels()
          if (key.upArrow) setSelectedIndex((prev) => Math.max(0, prev - 1))
          else if (key.downArrow) setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1))
          else if (key.return) {
            if (filtered.length > 0 && selectedIndex < filtered.length) {
              setSelectedModel(filtered[selectedIndex].id)
              completeSetup()
            }
          } else if (key.tab || input === '/') {
            setIsFiltering(true)
            setFilter('')
            setSelectedIndex(0)
          } else if (input.length === 1 && !key.ctrl && !key.meta) {
            setFilter(input)
            setIsFiltering(true)
            setSelectedIndex(0)
          }
        }
      } else if (step === 'complete') {
        if (key.return) onComplete()
      }
    },
    { isActive: true },
  )

  const getFilteredModels = useCallback(() => {
    if (!filter.trim()) return models
    const lower = filter.toLowerCase()
    return models.filter((m) => m.id.toLowerCase().includes(lower))
  }, [models, filter])

  const startModelDiscovery = useCallback(async () => {
    if (!selectedProvider) return
    setIsLoading(true)
    setError('')

    try {
      if (selectedProvider.name === 'ollama') {
        const discovered = await discoverModels('ollama', undefined, ollamaUrl)
        setModels(discovered.models)
      } else if (apiKey) {
        const discovered = await discoverModels(
          selectedProvider.name as 'openai' | 'anthropic' | 'gemini',
          apiKey,
        )
        setModels(discovered.models)
      }

      if (models.length === 0) {
        setModels([{ id: selectedProvider.defaultModel, provider: selectedProvider.name as ModelInfo['provider'] }])
      }
      setStep('model')
      setSelectedIndex(0)
    } catch (err) {
      setError(`Model discovery failed: ${err instanceof Error ? err.message : String(err)}`)
      setModels([{ id: selectedProvider.defaultModel, provider: selectedProvider.name as ModelInfo['provider'] }])
      setStep('model')
    } finally {
      setIsLoading(false)
    }
  }, [selectedProvider, apiKey, ollamaUrl, models.length])

  const completeSetup = useCallback(() => {
    if (!selectedProvider || !selectedModel) return

    try {
      const providerConfig: Provider = {
        name: selectedProvider.name as Provider['name'],
        apiKey: selectedProvider.requiresApiKey && apiKey ? encryptKey(apiKey) : undefined,
        baseUrl: selectedProvider.name === 'ollama' ? ollamaUrl : undefined,
        model: selectedModel,
        isActive: true,
      }

      addProvider(providerConfig)
      setActiveProvider(selectedProvider.name)
      setStep('complete')
    } catch (err) {
      setError(`Setup failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [selectedProvider, selectedModel, apiKey, ollamaUrl])

  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Setup Wizard</Text>
        <Text color="gray"> - Configure your AI provider</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}

      {isLoading && (
        <Box marginBottom={1}>
          <Text color="yellow">{spinnerChars[spinnerFrame]} Discovering models...</Text>
        </Box>
      )}

      {step === 'provider' && (
        <Box flexDirection="column">
          <Text bold>Select AI Provider:</Text>
          {PROVIDER_OPTIONS.map((p, i) => (
            <Box key={p.name}>
              <Text color={i === selectedIndex ? 'green' : 'gray'}>
                {i === selectedIndex ? '▸ ' : '  '}
              </Text>
              <Text bold color={i === selectedIndex ? 'green' : 'white'}>
                {p.label}
              </Text>
              <Text color="gray">
                {p.requiresApiKey ? '' : ' (no API key needed)'}
              </Text>
            </Box>
          ))}
          <Box marginTop={1}>
            <Text dimColor>↑↓: navigate | Enter: select | Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {(step === 'apiKey' || step === 'ollamaUrl') && (
        <Box flexDirection="column">
          <Text bold>
            {step === 'apiKey'
              ? `Enter your ${selectedProvider?.label} API key:`
              : 'Enter Ollama URL:'}
          </Text>
          <Box marginTop={1}>
            <Text color="green">{'> '}</Text>
            <Text>{inputBuffer || (step === 'ollamaUrl' ? 'http://localhost:11434' : '')}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>
              {step === 'apiKey'
                ? '(Your key is encrypted and stored locally)'
                : '(default: http://localhost:11434)'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Enter: confirm | Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {step === 'model' && (
        <Box flexDirection="column">
          <Text bold>
            Select Model ({getFilteredModels().length} available):
          </Text>
          {isFiltering && (
            <Box>
              <Text color="yellow">{'> '} </Text>
              <Text bold>{filter}</Text>
              <Text dimColor> │ Esc: clear filter</Text>
            </Box>
          )}
          {getFilteredModels().slice(0, 10).map((m, i) => (
            <Box key={m.id}>
              <Text color={i === selectedIndex ? 'green' : 'gray'}>
                {i === selectedIndex ? '▸ ' : '  '}
              </Text>
              <Text color={i === selectedIndex ? 'green' : 'white'}>
                {m.id}
              </Text>
            </Box>
          ))}
          {getFilteredModels().length > 10 && (
            <Text dimColor>  ... and {getFilteredModels().length - 10} more</Text>
          )}
          <Box marginTop={1}>
            <Text dimColor>
              {isFiltering
                ? 'Enter: select | Esc: clear filter'
                : '↑↓: navigate | Enter: select | Tab or /: filter | Esc: cancel'}
            </Text>
          </Box>
        </Box>
      )}

      {step === 'complete' && (
        <Box flexDirection="column">
          <Text bold color="green">Provider configured successfully!</Text>
          <Box marginTop={1}>
            <Text>  Provider: </Text>
            <Text bold color="cyan">{selectedProvider?.label}</Text>
          </Box>
          <Box>
            <Text>  Model: </Text>
            <Text bold color="cyan">{selectedModel}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press Enter to continue</Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

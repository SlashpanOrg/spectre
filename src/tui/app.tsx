import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { TextInput } from '@inkjs/ui'
import {
  Header,
  StatusBar,
  SidePanel,
  SelectableList,
  CommandPalette,
  ProgressIndicator,
  Spinner,
  useStreaming,
  defaultTheme,
} from '../tui-lib/index.js'
import { WELCOME_MESSAGE, VERSION } from '../utils/branding.js'
import { CommandParser, CommandDefinition } from '../commands/parser.js'
import {
  getActiveProvider,
  addProvider,
  setActiveProvider,
  encryptKey,
  decryptKey,
  Provider,
} from '../utils/config.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { AgentOrchestrator } from '../agent/orchestrator.js'
import { ToolRegistry } from '../agent/tools/registry.js'
import { discoverModels, ModelInfo } from '../ai/model-discovery.js'
import { createSession, SessionStore } from '../session/session-store.js'
import { logger } from '../utils/logger.js'
import { TokenBar } from './components/token-bar.js'
import { TaskTimerDisplay } from './components/task-timer.js'
import { AutocompleteInput } from './components/autocomplete-input.js'

function clearTerminal(): void {
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
}

const PROVIDER_OPTIONS = [
  { name: 'openai', label: 'OpenAI', requiresApiKey: true, defaultModel: 'gpt-4o-mini' },
  {
    name: 'anthropic',
    label: 'Anthropic',
    requiresApiKey: true,
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    name: 'gemini',
    label: 'Google Gemini',
    requiresApiKey: true,
    defaultModel: 'gemini-2.5-flash',
  },
  { name: 'ollama', label: 'Ollama', requiresApiKey: false, defaultModel: 'llama3' },
]

type AppView = 'chat' | 'setup' | 'modelSwitcher'
type WizardStep = 'provider' | 'apiKey' | 'ollamaUrl' | 'model' | 'complete'

interface AppMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'error'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface SpectreAppProps {
  parser: CommandParser
}

export const SpectreApp: React.FC<SpectreAppProps> = ({ parser }) => {
  const { exit } = useApp()
  const colors = defaultTheme.colors

  const [view, setView] = useState<AppView>(() => {
    const active = getActiveProvider()
    return active ? 'chat' : 'setup'
  })
  const [messages, setMessages] = useState<AppMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
    {
      id: 'hint',
      role: 'system',
      content: 'Type /help for available commands or just ask a question.',
      timestamp: new Date(),
    },
  ])
  const [inputKey, setInputKey] = useState(0)
  const [sessionId, setSessionId] = useState(() => {
    const store = new SessionStore()
    const session = createSession('Spectre TUI session')
    store.save(session)
    return session.id
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingConfirmKill, setPendingConfirmKill] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [currentProvider, setCurrentProvider] = useState(() => {
    const active = getActiveProvider()
    return active ? active.name : 'none'
  })
  const [currentModel, setCurrentModel] = useState(() => {
    const active = getActiveProvider()
    return active ? active.model : 'none'
  })
  const [terminalSize, setTerminalSize] = useState(() => ({
    columns: process.stdout.columns || 120,
    rows: process.stdout.rows || 40,
  }))
  const [tokenStats, setTokenStats] = useState({
    usedTokens: 0,
    totalTokens: 0,
    contextWindow: 128000,
  })
  const [activeTask, setActiveTask] = useState<{ label: string; startTime: number } | null>(null)

  const [progress, setProgress] = useState<{
    visible: boolean
    current: number
    total: number
    label: string
    step?: string
  }>({ visible: false, current: 0, total: 0, label: '' })

  const orchestratorRef = useRef<AgentOrchestrator | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setTerminalSize({
        columns: process.stdout.columns || 120,
        rows: process.stdout.rows || 40,
      })
    }

    process.stdout.on('resize', handleResize)
    return () => {
      process.stdout.off('resize', handleResize)
      clearTerminal()
    }
  }, [])

  const getOrchestrator = useCallback(async () => {
    if (!orchestratorRef.current) {
      try {
        const toolRegistry = new ToolRegistry()
        orchestratorRef.current = new AgentOrchestrator(getProvider(), toolRegistry)
        await orchestratorRef.current.initialize()
      } catch {
        orchestratorRef.current = null
      }
    }
    return orchestratorRef.current
  }, [])

  const {
    isStreaming,
    cancelStream,
  } = useStreaming()

  const addMessage = useCallback((role: AppMessage['role'], content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random()}`, role, content, timestamp: new Date() },
    ])
  }, [])

  const persistSessionMessage = useCallback(
    (role: 'user' | 'assistant' | 'system' | 'tool' | 'error', content: string) => {
      try {
        new SessionStore().appendMessage(sessionId, role, content)
      } catch (error) {
        logger.warn(
          `Failed to save session message: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    },
    [sessionId],
  )

  const updateProviderStatus = useCallback(() => {
    const active = getActiveProvider()
    const nextProvider = active ? active.name : 'none'
    const nextModel = active ? active.model : 'none'

    setCurrentProvider((prev) => {
      if (prev !== nextProvider) orchestratorRef.current = null
      return nextProvider
    })
    setCurrentModel((prev) => {
      if (prev !== nextModel) orchestratorRef.current = null
      return nextModel
    })
  }, [])

  const updateAgentStats = useCallback((orchestrator?: AgentOrchestrator | null) => {
    const active = orchestrator || orchestratorRef.current
    if (!active) return

    const stats = active.getTokenStats()
    setTokenStats({
      usedTokens: stats.currentSession.totalTokens,
      totalTokens: stats.currentSession.totalTokens,
      contextWindow: stats.modelContextWindow,
    })
  }, [])

  const finishProcessing = useCallback(
    (orchestrator?: AgentOrchestrator | null) => {
      updateAgentStats(orchestrator)
      updateProviderStatus()
      setActiveTask(null)
      setIsProcessing(false)
      setPendingConfirmKill(false)
    },
    [updateAgentStats, updateProviderStatus],
  )

  const exitCleanly = useCallback(() => {
    setIsProcessing(false)
    setActiveTask(null)
    clearTerminal()
    exit()
    setTimeout(clearTerminal, 0)
  }, [exit])

  const showProgress = useCallback(
    (label: string, current: number, total: number, step?: string) => {
      setProgress({ visible: true, current, total, label, step })
    },
    [],
  )

  const hideProgress = useCallback(() => {
    setProgress((prev) => ({ ...prev, visible: false }))
  }, [])

  const handleAgentTask = useCallback(
    async (taskDescription: string) => {
      if (!taskDescription.trim()) {
        addMessage('error', 'Usage: /agent <description>')
        finishProcessing()
        return
      }

      try {
        clearProviderCache()
        const orch = await getOrchestrator()
        if (!orch) {
          addMessage('error', 'No AI provider configured. Run /setup to configure one.')
          finishProcessing()
          return
        }

        setActiveTask({ label: 'Agent working', startTime: Date.now() })

        const taskMsgId = `msg-${Date.now()}-agent-task`
        setMessages((prev) => [
          ...prev,
          {
            id: taskMsgId,
            role: 'system',
            content: `Assigned to Spectre\nTask: ${taskDescription}\nStatus: processing...`,
            timestamp: new Date(),
          },
        ])

        showProgress(`Agent: ${taskDescription}`, 0, 1, 'Processing...')

        const response = await orch.processMessage(taskDescription)
        const displayResponse = response.trim() || 'Spectre completed the request, but the model did not return a text response.'

        hideProgress()
        updateAgentStats(orch)

        setMessages((prev) =>
          prev.map((m) =>
            m.id === taskMsgId ? { ...m, content: displayResponse, role: 'assistant' as const } : m,
          ),
        )
        persistSessionMessage('assistant', displayResponse)
      } catch (error) {
        hideProgress()
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Agent failed: ${msg}`)
        logger.error('Agent execution failed:', msg)
      }

      finishProcessing(orchestratorRef.current)
    },
    [addMessage, getOrchestrator, showProgress, hideProgress, finishProcessing, updateAgentStats, persistSessionMessage],
  )

  const handleCommand = useCallback(
    async (input: string) => {
      setIsProcessing(true)
      setActiveTask({ label: input.startsWith('/') ? 'Running command' : 'Thinking', startTime: Date.now() })
      addMessage('user', input)
      persistSessionMessage('user', input)

      try {
        if (input === '/new' || input.startsWith('/new ')) {
          const title = input.slice('/new'.length).trim() || 'Spectre TUI session'
          const session = createSession(title)
          new SessionStore().save(session)
          setSessionId(session.id)
          setMessages([
            { id: 'welcome', role: 'system', content: WELCOME_MESSAGE, timestamp: new Date() },
            {
              id: 'hint',
              role: 'system',
              content: `Started ${session.id}. Type /help for commands.`,
              timestamp: new Date(),
            },
          ])
          finishProcessing()
          return
        }

        if (input === '/model') {
          setView('modelSwitcher')
          finishProcessing()
          return
        }

        if (input.startsWith('/agent ')) {
          await handleAgentTask(input.slice('/agent '.length).trim())
          return
        }

        const result = await parser.execute(input)

        if (result === '__QUIT__') {
          exitCleanly()
          return
        }

        if (result === '__WIZARD__') {
          setView('setup')
          finishProcessing()
          return
        }

        if (result === '__HELP__') {
          const help = parser.getHelp()
          addMessage('tool', help)
          persistSessionMessage('tool', help)
          finishProcessing()
          return
        }

        if (result) {
          addMessage('tool', result)
          persistSessionMessage('tool', result)
        } else {
          await handleAgentQuery(input)
          return
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Error: ${msg}`)
        logger.error('Command execution failed:', msg)
      }

      finishProcessing(orchestratorRef.current)
    },
    [parser, addMessage, exitCleanly, handleAgentTask, persistSessionMessage, finishProcessing],
  )

  const handleAgentQuery = useCallback(
    async (input: string) => {
      try {
        clearProviderCache()
        const orch = await getOrchestrator()
        if (!orch) {
          addMessage('error', 'No AI provider configured. Run /setup to configure one.')
          finishProcessing()
          return
        }

        const streamingMsgId = `msg-${Date.now()}-stream`
        setActiveTask({ label: 'Spectre thinking', startTime: Date.now() })
        setMessages((prev) => [
          ...prev,
          { id: streamingMsgId, role: 'assistant', content: 'Thinking...', timestamp: new Date(), isStreaming: true },
        ])

        const response = await orch.processMessage(input)
        const displayResponse = response.trim() || 'Spectre completed the request, but the model did not return a text response.'
        updateAgentStats(orch)

        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingMsgId
              ? { ...m, content: displayResponse, role: 'assistant' as const, isStreaming: false }
              : m,
          ),
        )
        persistSessionMessage('assistant', displayResponse)
      } catch (error) {
        hideProgress()
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Agent failed: ${msg}`)
        logger.error('Agent execution failed:', msg)
      }

      finishProcessing(orchestratorRef.current)
    },
    [getOrchestrator, addMessage, persistSessionMessage, hideProgress, finishProcessing, updateAgentStats],
  )

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed || isProcessing || view !== 'chat') return
      setInputKey((prev) => prev + 1)
      handleCommand(trimmed)
    },
    [isProcessing, handleCommand, view],
  )

  const commands = useMemo((): CommandDefinition[] => {
    const registered = parser.getCommands()
    return registered.map((cmd) => ({
      id: cmd.name,
      name: `/${cmd.name}`,
      description: cmd.description,
      execute: () => {
        setShowCommandPalette(false)
        handleCommand(`/${cmd.name}`)
      },
    }))
  }, [parser, handleCommand])

  const commandSuggestions = useMemo(() => {
    return commands.map((cmd) => ({
      label: cmd.name,
      description: cmd.description,
    }))
  }, [commands])

  const latestUserId = useMemo(() => {
    return [...messages].reverse().find((msg) => msg.role === 'user')?.id
  }, [messages])
  const latestResponseId = useMemo(() => {
    return [...messages].reverse().find((msg) => msg.role !== 'user' && msg.role !== 'system')?.id
  }, [messages])
  const focusedMessageIds = useMemo(() => {
    return new Set([latestUserId, latestResponseId].filter(Boolean) as string[])
  }, [latestUserId, latestResponseId])

  useInput(
    (input, key) => {
      if (input === 'q' && key.ctrl) {
        exitCleanly()
      }
      if (key.escape && view === 'chat') {
        if (isProcessing || isStreaming) {
          if (pendingConfirmKill) {
            cancelStream()
            setPendingConfirmKill(false)
            setTimeout(() => finishProcessing(orchestratorRef.current), 100)
          } else {
            setPendingConfirmKill(true)
            setTimeout(() => setPendingConfirmKill(false), 5000)
          }
        }
        return
      }
      if (input === 'k' && key.ctrl && view === 'chat') {
        setShowCommandPalette((prev) => !prev)
      }
      if (input === 'u' && key.ctrl && view === 'chat') {
        setShowSidePanel((prev) => !prev)
      }
      if (input === 'c' && key.ctrl && isStreaming) {
        cancelStream()
      }
    },
    { isActive: view === 'chat' },
  )

  const shortcuts = [
    { key: 'Ctrl+K', action: 'commands' },
    { key: 'Ctrl+U', action: 'panel' },
    { key: 'Ctrl+Q', action: 'quit' },
  ]

  if (view === 'setup') {
    return (
      <SetupWizard
        onComplete={() => {
          setView('chat')
          updateProviderStatus()
          addMessage(
            'system',
            'Provider configured successfully! Try /model to switch models or /agent <task> to assign work.',
          )
        }}
        onCancel={() => {
          const active = getActiveProvider()
          if (!active) {
            exitCleanly()
          } else {
            setView('chat')
            finishProcessing()
          }
        }}
      />
    )
  }

  if (view === 'modelSwitcher') {
    return (
      <ModelSwitcher
        onComplete={(model) => {
          setView('chat')
          updateProviderStatus()
          addMessage('system', `Switched model to ${model}.`)
        }}
        onCancel={() => {
          setView('chat')
          finishProcessing()
        }}
      />
    )
  }

  const sidePanelSections = [
    {
      title: 'Session',
      items: [
        { label: 'ID', value: sessionId },
        { label: 'Provider', value: currentProvider },
        { label: 'Model', value: currentModel },
        { label: 'Messages', value: String(messages.length) },
      ],
    },
    {
      title: 'Shortcuts',
      items: [
        { label: 'Ctrl+K', value: 'Command Palette' },
        { label: 'Ctrl+U', value: 'Toggle Panel' },
        { label: 'Ctrl+Q', value: 'Quit' },
        { label: 'Ctrl+C', value: 'Cancel Stream' },
      ],
    },
  ]

  const status = isStreaming ? 'streaming' : isProcessing ? 'loading' : 'idle'

  return (
    <Box flexDirection="column" width={terminalSize.columns}>
      <Header
        title="Spectre"
        subtitle="AI Development Intelligence Agent"
        version={VERSION}
        provider={currentProvider}
        model={currentModel}
      />

       <Box flexDirection="row">
         <Box flexDirection="column" flexGrow={1}>
           <Box flexDirection="column" flexGrow={1} overflowY="hidden">
             {messages.map((msg) => (
               <ChatMessageBox
                 key={msg.id}
                 message={msg}
                 focused={focusedMessageIds.has(msg.id)}
               />
             ))}
           </Box>

          <Box flexDirection="row" justifyContent="space-between" paddingX={2} paddingY={0}>
            <TokenBar
              usedTokens={tokenStats.usedTokens}
              totalTokens={tokenStats.totalTokens}
              contextWindow={tokenStats.contextWindow}
            />
            {activeTask && <TaskTimerDisplay startTime={activeTask.startTime} label={activeTask.label} />}
          </Box>

          <ProgressIndicator
            current={progress.current}
            total={progress.total}
            label={progress.label}
            step={progress.step}
            visible={progress.visible}
          />

          {pendingConfirmKill && (
            <Box paddingX={2} paddingY={0}>
              <Text color={colors.warning} bold>
                ⚠ Press Escape again to cancel the current task
              </Text>
            </Box>
          )}

          <Box
            paddingX={2}
            paddingY={1}
            borderStyle="single"
            borderColor={isStreaming ? colors.warning : colors.border}
          >
            <Text color={colors.highlight}>{'> '} </Text>
            <AutocompleteInput
              key={inputKey}
              placeholder={isProcessing ? 'Processing...' : 'Enter command or question...'}
              onSubmit={handleSubmit}
              isDisabled={isProcessing || showCommandPalette}
              suggestions={commandSuggestions}
            />
            {isStreaming && <Text color={colors.warning}> │ Ctrl+C to cancel</Text>}
          </Box>
        </Box>

        {showSidePanel && (
          <Box borderStyle="single" borderColor={colors.border} width={30}>
            <SidePanel
              title="Spectre"
              sections={sidePanelSections}
              visible={showSidePanel}
            />
          </Box>
        )}
      </Box>

      <StatusBar
        provider={currentProvider}
        model={currentModel}
        shortcuts={shortcuts}
        status={status}
      />

      <CommandPalette
        commands={commands}
        onSelect={(cmd) => cmd.execute()}
        onClose={() => setShowCommandPalette(false)}
        visible={showCommandPalette}
      />
    </Box>
  )
}

const ChatMessageBox: React.FC<{ message: AppMessage; focused: boolean }> = ({ message, focused }) => {
  const colors = defaultTheme.colors
  const roleConfig = (() => {
    switch (message.role) {
      case 'user':
        return { label: 'You', color: colors.primary }
      case 'assistant':
        return { label: 'Spectre', color: colors.success }
      case 'tool':
        return { label: 'Tool', color: colors.info }
      case 'error':
        return { label: 'Error', color: colors.error }
      default:
        return { label: 'System', color: colors.textMuted }
    }
  })()

  const content = message.content.trim() || (message.isStreaming ? 'Thinking...' : 'No response text returned.')
  const isDimmed = message.role === 'system' || !focused
  const borderColor = isDimmed ? colors.border : roleConfig.color
  const textColor = message.role === 'system' || isDimmed ? colors.textMuted : colors.text

  return (
    <Box flexDirection="column" paddingX={2} paddingY={0}>
      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
        <Box>
          <Text bold={!isDimmed} color={isDimmed ? colors.textMuted : roleConfig.color} dimColor={isDimmed}>{roleConfig.label}</Text>
          {message.isStreaming && <Text color={colors.warning}> thinking</Text>}
        </Box>
        <Text color={textColor} dimColor={isDimmed} wrap="wrap">
          {content}
        </Text>
      </Box>
    </Box>
  )
}

interface SetupWizardProps {
  onComplete: () => void
  onCancel: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const colors = defaultTheme.colors
  const [step, setStep] = useState<WizardStep>('provider')
  const [selectedProvider, setSelectedProvider] = useState<(typeof PROVIDER_OPTIONS)[0] | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useInput(
    (input, key) => {
      if (key.escape) {
        onCancel()
        return
      }

      if (isLoading) return

      if (step === 'complete') {
        if (key.return) onComplete()
      }
    },
    { isActive: step === 'complete' },
  )

  const startModelDiscovery = useCallback(async () => {
    if (!selectedProvider) return
    setIsLoading(true)
    setError('')

    try {
      let discoveredModels: ModelInfo[] = []
      if (selectedProvider.name === 'ollama') {
        const discovered = await discoverModels('ollama', undefined, ollamaUrl)
        discoveredModels = discovered.models
      } else if (apiKey) {
        const discovered = await discoverModels(
          selectedProvider.name as 'openai' | 'anthropic' | 'gemini',
          apiKey,
        )
        discoveredModels = discovered.models
      }

      setModels(
        discoveredModels.length > 0
          ? discoveredModels
          : [
              {
                id: selectedProvider.defaultModel,
                provider: selectedProvider.name as ModelInfo['provider'],
              },
            ],
      )
      setStep('model')
    } catch (err) {
      setError(`Model discovery failed: ${err instanceof Error ? err.message : String(err)}`)
      setModels([
        {
          id: selectedProvider.defaultModel,
          provider: selectedProvider.name as ModelInfo['provider'],
        },
      ])
      setStep('model')
    } finally {
      setIsLoading(false)
    }
  }, [selectedProvider, apiKey, ollamaUrl])

  const completeSetup = useCallback(
    (model: ModelInfo) => {
      if (!selectedProvider) return

      try {
        const providerConfig: Provider = {
          name: selectedProvider.name as Provider['name'],
          apiKey: selectedProvider.requiresApiKey && apiKey ? encryptKey(apiKey) : undefined,
          baseUrl: selectedProvider.name === 'ollama' ? ollamaUrl : undefined,
          model: model.id,
          isActive: true,
        }

        addProvider(providerConfig)
        setActiveProvider(selectedProvider.name)
        setSelectedModel(model.id)
        setStep('complete')
      } catch (err) {
        setError(`Setup failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [selectedProvider, apiKey, ollamaUrl],
  )

  const handleApiKeySubmit = useCallback(
    (value: string) => {
      if (!value.trim()) return
      setApiKey(value.trim())
      startModelDiscovery()
    },
    [startModelDiscovery],
  )

  const handleOllamaUrlSubmit = useCallback(
    (value: string) => {
      setOllamaUrl(value.trim() || 'http://localhost:11434')
      startModelDiscovery()
    },
    [startModelDiscovery],
  )

  if (step === 'provider') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>Setup Wizard</Text>
          <Text color={colors.textMuted}> - Configure your AI provider</Text>
        </Box>

        <SelectableList
          items={PROVIDER_OPTIONS}
          title="Select AI Provider"
          maxVisible={10}
          renderItem={(p, _i, isSelected) => (
            <Box>
              <Text color={isSelected ? colors.success : colors.textMuted}>
                {isSelected ? '▸ ' : '  '}
              </Text>
              <Text bold color={isSelected ? colors.success : colors.text}>{p.label}</Text>
              <Text color={colors.textMuted}>{p.requiresApiKey ? '' : ' (no API key needed)'}</Text>
            </Box>
          )}
          onSelect={(p) => {
            setSelectedProvider(p)
            if (p.name === 'ollama') {
              setStep('ollamaUrl')
            } else {
              setStep('apiKey')
            }
          }}
          onCancel={onCancel}
        />
      </Box>
    )
  }

  if (step === 'model') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>Setup Wizard</Text>
          <Text color={colors.textMuted}> - Select Model</Text>
        </Box>

        {isLoading && (
          <Box marginBottom={1}>
            <Spinner label="Discovering models..." visible />
          </Box>
        )}

        {error && (
          <Box marginBottom={1}>
            <Text color={colors.error}>✗ {error}</Text>
          </Box>
        )}

        {!isLoading && (
          <SelectableList
            items={models}
            title={`Select Model (${models.length} available)`}
            maxVisible={10}
            renderItem={(m, _i, isSelected) => (
              <Box>
                <Text color={isSelected ? colors.success : colors.textMuted}>
                  {isSelected ? '▸ ' : '  '}
                </Text>
                <Text color={isSelected ? colors.success : colors.text}>{m.id}</Text>
              </Box>
            )}
            onSelect={completeSetup}
            onCancel={onCancel}
          />
        )}
      </Box>
    )
  }

  if (step === 'complete') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color={colors.primary}>Setup Wizard</Text>
        </Box>

        <Box flexDirection="column">
          <Text bold color={colors.success}>Provider configured successfully!</Text>
          <Box marginTop={1}>
            <Text> Provider: </Text>
            <Text bold color={colors.info}>{selectedProvider?.label}</Text>
          </Box>
          <Box>
            <Text> Model: </Text>
            <Text bold color={colors.info}>{selectedModel}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={colors.info}>
              Next: /model to switch models • /agent &lt;task&gt; to assign work • /help for commands
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textMuted} dimColor>Press Enter to continue</Text>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Setup Wizard</Text>
        <Text color={colors.textMuted}> - Configure your AI provider</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color={colors.error}>✗ {error}</Text>
        </Box>
      )}

      {step === 'apiKey' && (
        <Box flexDirection="column">
          <Text bold>Enter your {selectedProvider?.label} API key:</Text>
          <Box marginTop={1}>
            <TextInput
              placeholder="Paste or type your API key..."
              onSubmit={handleApiKeySubmit}
            />
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textMuted} dimColor>(Your key is encrypted and stored locally)</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textMuted} dimColor>Enter: confirm | Esc: cancel</Text>
          </Box>
        </Box>
      )}

      {step === 'ollamaUrl' && (
        <Box flexDirection="column">
          <Text bold>Enter Ollama URL:</Text>
          <Box marginTop={1}>
            <TextInput
              placeholder="http://localhost:11434"
              onSubmit={handleOllamaUrlSubmit}
            />
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textMuted} dimColor>(default: http://localhost:11434)</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textMuted} dimColor>Enter: confirm | Esc: cancel</Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

interface ModelSwitcherProps {
  onComplete: (model: string) => void
  onCancel: () => void
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ onComplete, onCancel }) => {
  const colors = defaultTheme.colors
  const active = getActiveProvider()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  React.useEffect(() => {
    let cancelled = false
    async function loadModels() {
      if (!active) {
        setError('No provider configured. Run /setup first.')
        setIsLoading(false)
        return
      }

      try {
        const apiKey = active.apiKey ? decryptKey(active.apiKey) : undefined
        const discovery = await discoverModels(active.name, apiKey, active.baseUrl)
        const discoveredModels =
          discovery.models.length > 0
            ? discovery.models
            : [{ id: active.model, provider: active.name as ModelInfo['provider'] }]
        if (!cancelled) setModels(discoveredModels)
      } catch (err) {
        if (!cancelled) {
          setError(`Model discovery failed: ${err instanceof Error ? err.message : String(err)}`)
          setModels(
            active ? [{ id: active.model, provider: active.name as ModelInfo['provider'] }] : [],
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadModels()
    return () => {
      cancelled = true
    }
  }, [active])

  const selectModel = useCallback(
    (model: ModelInfo) => {
      if (!active) return
      addProvider({ ...active, model: model.id, isActive: true })
      setActiveProvider(active.name)
      clearProviderCache()
      onComplete(model.id)
    },
    [active, onComplete],
  )

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color={colors.primary}>Model Switcher</Text>
        <Text color={colors.textMuted}> - choose the active model</Text>
      </Box>

      {!active && <Text color={colors.error}>No provider configured. Run /setup first.</Text>}
      {error && <Text color={colors.error}>✗ {error}</Text>}
      {active && (
        <Box marginBottom={1}>
          <Text color={colors.textMuted}>Provider: </Text>
          <Text color={colors.info} bold>{active.name}</Text>
          <Text color={colors.textMuted}> • Current: </Text>
          <Text color={colors.info}>{active.model}</Text>
        </Box>
      )}

      {isLoading ? (
        <Spinner label="Discovering models..." visible />
      ) : (
        <SelectableList
          items={models}
          title={`Available Models (${models.length})`}
          maxVisible={12}
          renderItem={(m, _i, isSelected) => {
            const isActiveModel = active?.model === m.id
            return (
              <Box>
                <Text color={isSelected ? colors.success : colors.textMuted}>
                  {isSelected ? '▸ ' : '  '}
                </Text>
                <Text color={isSelected ? colors.success : colors.text} bold={isSelected}>
                  {m.id}
                </Text>
                {isActiveModel && <Text color={colors.info}> active</Text>}
              </Box>
            )
          }}
          onSelect={selectModel}
          onCancel={onCancel}
        />
      )}
    </Box>
  )
}

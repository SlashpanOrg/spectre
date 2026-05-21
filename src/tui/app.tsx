import React, { useState, useCallback, useRef, useMemo } from 'react'
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
import { AgentOrchestrator, AgentTask } from '../agent/orchestrator.js'
import { runAgentTool } from '../agent/tool-runner.js'
import { discoverModels, ModelInfo } from '../ai/model-discovery.js'
import { createSession, SessionStore } from '../session/session-store.js'
import { logger } from '../utils/logger.js'

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

  const [view, setView] = useState<AppView>('chat')
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

  const [progress, setProgress] = useState<{
    visible: boolean
    current: number
    total: number
    label: string
    step?: string
  }>({ visible: false, current: 0, total: 0, label: '' })

  const orchestratorRef = useRef<AgentOrchestrator | null>(null)
  const getOrchestrator = useCallback(() => {
    if (!orchestratorRef.current) {
      try {
        orchestratorRef.current = new AgentOrchestrator(getProvider(), runAgentTool)
      } catch {
        orchestratorRef.current = null
      }
    }
    return orchestratorRef.current
  }, [])

  const {
    isStreaming,
    content: streamingContent,
    startStream,
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
    setCurrentProvider(active ? active.name : 'none')
    setCurrentModel(active ? active.model : 'none')
    orchestratorRef.current = null
  }, [])

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
        setIsProcessing(false)
        return
      }

      try {
        clearProviderCache()
        const orch = getOrchestrator()
        if (!orch) {
          addMessage('error', 'No AI provider configured. Run /setup to configure one.')
          setIsProcessing(false)
          return
        }

        const taskMsgId = `msg-${Date.now()}-agent-task`
        setMessages((prev) => [
          ...prev,
          {
            id: taskMsgId,
            role: 'system',
            content: `Assigned to Spectre\nTask: ${taskDescription}\nStatus: planning...`,
            timestamp: new Date(),
          },
        ])

        const task = await orch.execute(taskDescription, (t: AgentTask) => {
          const completed = t.steps.filter((s) => s.status === 'completed').length
          const total = t.steps.length
          const runningIndex = t.steps.findIndex((s) => s.status === 'running')
          const running = runningIndex >= 0 ? t.steps[runningIndex] : undefined
          const failed = t.steps.find((s) => s.status === 'failed')

          showProgress(
            `Agent: ${taskDescription}`,
            completed,
            total,
            running ? `Current: ${running.description}` : failed ? `Failed: ${failed.error}` : undefined,
          )

          const details = [
            'Assigned to Spectre',
            `Task: ${taskDescription}`,
            `Status: ${t.status}`,
            `Progress: ${completed}/${total || '?'} steps`,
            running ? `Current: ${running.description}` : undefined,
            failed ? `Issue: ${failed.error || failed.description}` : undefined,
            'Ctrl+C attempts to stop the active operation.',
          ].filter(Boolean)

          setMessages((prev) =>
            prev.map((m) =>
              m.id === taskMsgId ? { ...m, content: details.join('\n'), timestamp: new Date() } : m,
            ),
          )
        })

        hideProgress()

        const stepLines = task.steps.map((step) => {
          const icon = step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : '○'
          return `${icon} ${step.description} (${step.tool})${step.error ? `\n   Error: ${step.error}` : ''}`
        })
        const summary = [
          `Agent Task: ${task.status}`,
          `Steps: ${task.steps.filter((s) => s.status === 'completed').length}/${task.steps.length} completed`,
          '',
          ...stepLines,
          task.result ? `\n${task.result}` : undefined,
        ].filter(Boolean)

        setMessages((prev) =>
          prev.map((m) =>
            m.id === taskMsgId ? { ...m, content: summary.join('\n'), role: 'tool' as const } : m,
          ),
        )
      } catch (error) {
        hideProgress()
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Agent failed: ${msg}`)
        logger.error('Agent execution failed:', msg)
      }

      updateProviderStatus()
      setIsProcessing(false)
    },
    [addMessage, getOrchestrator, updateProviderStatus, showProgress, hideProgress],
  )

  const handleCommand = useCallback(
    async (input: string) => {
      setIsProcessing(true)
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
          setIsProcessing(false)
          return
        }

        if (input === '/model') {
          setView('modelSwitcher')
          setIsProcessing(false)
          return
        }

        if (input.startsWith('/agent ')) {
          await handleAgentTask(input.slice('/agent '.length).trim())
          return
        }

        const result = await parser.execute(input)

        if (result === '__QUIT__') {
          addMessage('system', 'Goodbye!')
          setTimeout(() => exit(), 500)
          return
        }

        if (result === '__WIZARD__') {
          setView('setup')
          setIsProcessing(false)
          return
        }

        if (result === '__HELP__') {
          const help = parser.getHelp()
          addMessage('tool', help)
          persistSessionMessage('tool', help)
          setIsProcessing(false)
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

      updateProviderStatus()
      setIsProcessing(false)
    },
    [parser, addMessage, exit, updateProviderStatus, handleAgentTask, persistSessionMessage],
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
          { id: streamingMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
        ])

        await startStream(() => orch.queryStream(input))

        if (streamingContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: streamingContent, role: 'assistant' as const, isStreaming: false }
                : m,
            ),
          )
          persistSessionMessage('assistant', streamingContent)
        } else {
          const task = await orch.execute(input, (t: AgentTask) => {
            const completed = t.steps.filter(
              (s: { status: string }) => s.status === 'completed',
            ).length
            const total = t.steps.length
            const current = t.steps.find((s: { status: string }) => s.status === 'running')
            showProgress(
              `Planning: ${input}`,
              completed,
              total,
              current ? current.description : undefined,
            )
          })

          hideProgress()

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
              m.id === streamingMsgId ? { ...m, content: output, role: 'tool' as const } : m,
            ),
          )
        }
      } catch (error) {
        hideProgress()
        const msg = error instanceof Error ? error.message : String(error)
        addMessage('error', `Agent failed: ${msg}`)
        logger.error('Agent execution failed:', msg)
      }

      updateProviderStatus()
      setIsProcessing(false)
    },
    [getOrchestrator, addMessage, updateProviderStatus, startStream, streamingContent, persistSessionMessage, showProgress, hideProgress],
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

  useInput(
    (input, key) => {
      if (input === 'q' && key.ctrl) {
        addMessage('system', 'Goodbye!')
        setTimeout(() => exit(), 500)
      }
      if (input === 'k' && key.ctrl && view === 'chat') {
        setShowCommandPalette((prev) => !prev)
      }
      if (input === 'g' && key.ctrl && view === 'chat') {
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
    { key: 'Ctrl+G', action: 'panel' },
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
          setView('chat')
          setIsProcessing(false)
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
          setIsProcessing(false)
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
        { label: 'Ctrl+G', value: 'Toggle Panel' },
        { label: 'Ctrl+Q', value: 'Quit' },
        { label: 'Ctrl+C', value: 'Cancel Stream' },
      ],
    },
  ]

  const status = isStreaming ? 'streaming' : isProcessing ? 'loading' : 'idle'

  return (
    <Box flexDirection="column" height="100%">
      <Header
        title="Spectre"
        subtitle="AI Development Intelligence Agent"
        version={VERSION}
        provider={currentProvider}
        model={currentModel}
      />

      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          <Box flexDirection="column" flexGrow={1} overflow="hidden">
            {messages.map((msg) => (
              <Box key={msg.id} flexDirection="column" paddingX={2} paddingY={msg.role === 'system' ? 0 : 1}>
                {msg.role === 'user' && (
                  <Text bold color={colors.primary}>You</Text>
                )}
                {msg.role === 'assistant' && (
                  <Box>
                    <Text bold color={colors.success}>AI</Text>
                    {msg.isStreaming && <Text color={colors.warning}> ⠋</Text>}
                  </Box>
                )}
                {msg.role === 'tool' && (
                  <Text color={colors.text}>{msg.content}</Text>
                )}
                {msg.role === 'system' && (
                  <Text color={colors.textMuted} dimColor>{msg.content}</Text>
                )}
                {msg.role === 'error' && (
                  <Text color={colors.error}>✗ {msg.content}</Text>
                )}
              </Box>
            ))}
          </Box>

          <ProgressIndicator
            current={progress.current}
            total={progress.total}
            label={progress.label}
            step={progress.step}
            visible={progress.visible}
          />

          <Box
            paddingX={2}
            paddingY={1}
            borderStyle="single"
            borderColor={isStreaming ? colors.warning : colors.border}
          >
            <Text color={colors.highlight}>{'> '} </Text>
            <TextInput
              key={inputKey}
              placeholder={isProcessing ? 'Processing...' : 'Enter command or question...'}
              onSubmit={handleSubmit}
              isDisabled={isProcessing}
            />
            {isStreaming && <Text color={colors.warning}> │ Ctrl+C to cancel</Text>}
          </Box>
        </Box>

        <Box borderStyle="single" borderColor={colors.border} width={30}>
          <SidePanel
            title="Spectre"
            sections={sidePanelSections}
            visible={showSidePanel}
          />
        </Box>
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
  const [inputBuffer, setInputBuffer] = useState('')

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

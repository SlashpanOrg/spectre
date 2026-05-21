import React, { useReducer, useCallback } from 'react'
import { Box, useApp, useInput } from 'ink'
import { Layout } from './Layout.js'
import { Header } from './Header.js'
import { StatusBar } from './StatusBar.js'
import { SidePanel } from './SidePanel.js'
import { ChatView } from './ChatView.js'
import { CommandPalette } from './CommandPalette.js'

import {
  AppState,
  AppAction,
  ChatMessage,
  CommandDefinition,
  PanelSection,
} from '../types/component.js'
import { defaultTheme, Theme } from '../types/theme.js'

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROVIDER':
      return { ...state, provider: action.provider }
    case 'SET_MODEL':
      return { ...state, model: action.model }
    case 'SET_STATUS':
      return { ...state, status: action.status }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'UPDATE_STREAMING': {
      const messages = [...state.messages]
      const lastMsg = messages[messages.length - 1]
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
        messages[messages.length - 1] = { ...lastMsg, content: lastMsg.content + action.content }
      }
      return { ...state, messages }
    }
    case 'TOGGLE_SIDE_PANEL':
      return { ...state, showSidePanel: !state.showSidePanel }
    case 'TOGGLE_COMMAND_PALETTE':
      return { ...state, showCommandPalette: !state.showCommandPalette }
    case 'SET_COMMANDS':
      return { ...state, commands: action.commands }
    case 'SET_SIDE_PANEL_SECTIONS':
      return { ...state, sidePanelSections: action.sections }
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }
    default:
      return state
  }
}

const initialState: AppState = {
  provider: 'none',
  model: 'none',
  status: 'idle',
  messages: [],
  showSidePanel: false,
  showCommandPalette: false,
  commands: [],
  sidePanelSections: [],
}

export interface AppProps {
  title: string
  subtitle?: string
  version?: string
  theme?: Theme
  onCommand?: (command: string, args: string) => Promise<string | null>
  onSendMessage?: (message: string) => Promise<string>
  sidePanelSections?: PanelSection[]
  commands?: CommandDefinition[]
}

export function App({
  title,
  subtitle,
  version,
  theme = defaultTheme,
  onCommand,
  onSendMessage,
  sidePanelSections = [],
  commands = [],
}: AppProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    commands,
    sidePanelSections,
  })
  const { exit } = useApp()

  const handleSend = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      }
      dispatch({ type: 'ADD_MESSAGE', message: userMsg })
      dispatch({ type: 'SET_STATUS', status: 'loading' })

      if (message.startsWith('/')) {
        const parts = message.slice(1).split(/\s+/)
        const cmd = parts[0]
        const args = parts.slice(1).join(' ')

        if (cmd === 'quit' || cmd === 'exit') {
          exit()
          return
        }

        if (onCommand) {
          const result = await onCommand(cmd, args)
          if (result) {
            const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: result,
              timestamp: new Date(),
            }
            dispatch({ type: 'ADD_MESSAGE', message: aiMsg })
          }
        }
      } else if (onSendMessage) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        }
        dispatch({ type: 'ADD_MESSAGE', message: aiMsg })
        dispatch({ type: 'SET_STATUS', status: 'streaming' })

        try {
          const response = await onSendMessage(message)
          dispatch({ type: 'UPDATE_STREAMING', content: response })
          const messages = [...state.messages]
          const lastMsg = messages[messages.length - 1]
          if (lastMsg) {
            messages[messages.length - 1] = { ...lastMsg, isStreaming: false }
          }
          dispatch({ type: 'SET_STATUS', status: 'idle' })
        } catch (error) {
          const errorMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date(),
          }
          dispatch({ type: 'ADD_MESSAGE', message: errorMsg })
          dispatch({ type: 'SET_STATUS', status: 'error' })
        }
      }
    },
    [onCommand, onSendMessage, exit, state.messages],
  )

  useInput((input, key) => {
    if (key.ctrl && input === 'k') {
      dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })
    } else if (key.ctrl && input === 'g') {
      dispatch({ type: 'TOGGLE_SIDE_PANEL' })
    } else if (key.ctrl && input === 'l') {
      dispatch({ type: 'CLEAR_MESSAGES' })
    } else if (key.ctrl && input === 'c') {
      dispatch({ type: 'SET_STATUS', status: 'idle' })
    } else if (key.ctrl && input === 'd') {
      exit()
    }
  })

  const handleCommandSelect = useCallback(
    (command: CommandDefinition) => {
      command.execute()
      dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })
    },
    [dispatch],
  )

  const header = (
    <Header
      title={title}
      subtitle={subtitle}
      version={version}
      provider={state.provider}
      model={state.model}
      theme={theme}
    />
  )

  const statusBar = (
    <StatusBar
      provider={state.provider}
      model={state.model}
      status={state.status}
      shortcuts={[
        { key: 'Ctrl+K', action: 'Commands' },
        { key: 'Ctrl+G', action: 'Panel' },
        { key: 'Ctrl+L', action: 'Clear' },
        { key: 'Ctrl+D', action: 'Quit' },
      ]}
      theme={theme}
    />
  )

  const sidePanel = (
    <SidePanel
      title="Context"
      sections={state.sidePanelSections}
      visible={state.showSidePanel}
      theme={theme}
    />
  )

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Layout
        header={header}
        statusBar={statusBar}
        sidePanel={sidePanel}
        showSidePanel={state.showSidePanel}
        theme={theme}
      >
        <ChatView
          messages={state.messages}
          isStreaming={state.status === 'streaming'}
          onSend={handleSend}
          theme={theme}
        />
      </Layout>

      <CommandPalette
        commands={state.commands}
        onSelect={handleCommandSelect}
        onClose={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })}
        visible={state.showCommandPalette}
        theme={theme}
      />
    </Box>
  )
}

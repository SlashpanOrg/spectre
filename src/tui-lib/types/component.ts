import { Theme } from './theme.js'

export interface BaseProps {
  theme?: Theme
}

export interface LayoutProps extends BaseProps {
  header: React.ReactNode
  statusBar: React.ReactNode
  sidePanel?: React.ReactNode
  showSidePanel?: boolean
  children: React.ReactNode
}

export interface HeaderProps extends BaseProps {
  title: string
  subtitle?: string
  version?: string
  provider?: string
  model?: string
}

export interface StatusBarProps extends BaseProps {
  provider: string
  model: string
  shortcuts: { key: string; action: string }[]
  status?: 'idle' | 'loading' | 'error' | 'streaming'
}

export interface SidePanelProps extends BaseProps {
  title: string
  sections: PanelSection[]
  visible?: boolean
}

export interface PanelSection {
  title: string
  items: PanelItem[]
}

export interface PanelItem {
  label: string
  value?: string
  status?: 'success' | 'warning' | 'error' | 'info'
}

export interface SelectableListProps<T = string> extends BaseProps {
  items: T[]
  renderItem: (item: T, index: number, isSelected: boolean) => React.ReactNode
  onSelect: (item: T, index: number) => void
  onCancel?: () => void
  title?: string
  placeholder?: string
  initialIndex?: number
  maxVisible?: number
}

export interface ChatViewProps extends BaseProps {
  messages: ChatMessage[]
  isStreaming?: boolean
  onSend: (message: string) => void
  onCancel?: () => void
  placeholder?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface MessageProps extends BaseProps {
  message: ChatMessage
}

export interface CodeBlockProps extends BaseProps {
  code: string
  language?: string
}

export interface CommandPaletteProps extends BaseProps {
  commands: CommandDefinition[]
  onSelect: (command: CommandDefinition) => void
  onClose: () => void
  visible: boolean
}

export interface CommandDefinition {
  id: string
  name: string
  description: string
  shortcut?: string
  category?: string
  execute: () => void | Promise<void>
}

export interface ProgressIndicatorProps extends BaseProps {
  current: number
  total: number
  label?: string
  step?: string
  visible: boolean
}

export interface SpinnerProps extends BaseProps {
  label?: string
  visible?: boolean
}

export interface TextInputProps extends BaseProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  suggestions?: string[]
  autoFocus?: boolean
}

export interface AppState {
  provider: string
  model: string
  status: 'idle' | 'loading' | 'error' | 'streaming'
  messages: ChatMessage[]
  showSidePanel: boolean
  showCommandPalette: boolean
  commands: CommandDefinition[]
  sidePanelSections: PanelSection[]
}

export type AppAction =
  | { type: 'SET_PROVIDER'; provider: string }
  | { type: 'SET_MODEL'; model: string }
  | { type: 'SET_STATUS'; status: AppState['status'] }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_STREAMING'; content: string }
  | { type: 'TOGGLE_SIDE_PANEL' }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'SET_COMMANDS'; commands: CommandDefinition[] }
  | { type: 'SET_SIDE_PANEL_SECTIONS'; sections: PanelSection[] }
  | { type: 'CLEAR_MESSAGES' }

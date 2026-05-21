export { App } from './components/App.js'
export { Layout } from './components/Layout.js'
export { Header } from './components/Header.js'
export { StatusBar } from './components/StatusBar.js'
export { SidePanel } from './components/SidePanel.js'
export { SelectableList } from './components/SelectableList.js'
export { ChatView } from './components/ChatView.js'
export { Message } from './components/Message.js'
export { CodeBlock } from './components/CodeBlock.js'
export { CommandPalette } from './components/CommandPalette.js'
export { ProgressIndicator } from './components/ProgressIndicator.js'
export { Spinner } from './components/Spinner.js'
export { TextInput } from './components/TextInput.js'

export { useTerminalSize } from './hooks/useTerminalSize.js'
export { useKeyboard } from './hooks/useKeyboard.js'
export { useScroll } from './hooks/useScroll.js'
export { useStreaming } from './hooks/useStreaming.js'

export { fuzzyMatch, fuzzyFilter, highlightMatches } from './utils/fuzzy.js'
export { highlightCode, detectLanguage } from './utils/syntax.js'
export {
  withColor,
  withBold,
  withDim,
  withBg,
  truncate,
  padRight,
  padLeft,
  center,
  repeatChar,
  createProgressBar,
} from './utils/colors.js'

export type {
  Theme,
  ThemeColors,
  ThemeSpacing,
} from './types/theme.js'
export { defaultTheme } from './types/theme.js'

export type {
  AppState,
  AppAction,
  ChatMessage,
  CommandDefinition,
  PanelSection,
  PanelItem,
  LayoutProps,
  HeaderProps,
  StatusBarProps,
  SidePanelProps,
  SelectableListProps,
  ChatViewProps,
  MessageProps,
  CodeBlockProps,
  CommandPaletteProps,
  ProgressIndicatorProps,
  SpinnerProps,
  TextInputProps,
} from './types/component.js'

export type {
  KeyBinding,
  KeyHandler,
  KeyInfo,
} from './types/keyboard.js'

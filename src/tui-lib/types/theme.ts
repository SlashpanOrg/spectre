export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  info: string
  text: string
  textMuted: string
  background: string
  border: string
  highlight: string
  selected: string
  codeBackground: string
  statusBarBg: string
  headerBg: string
  panelBg: string
}

export interface ThemeSpacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

export interface Theme {
  colors: ThemeColors
  spacing: ThemeSpacing
  symbols: {
    bullet: string
    arrow: string
    check: string
    cross: string
    spinner: string[]
    separator: string
    selected: string
    unselected: string
  }
}

export const defaultTheme: Theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    background: '#0f172a',
    border: '#334155',
    highlight: '#fbbf24',
    selected: '#1e293b',
    codeBackground: '#1e293b',
    statusBarBg: '#1e1b4b',
    headerBg: '#1e1b4b',
    panelBg: '#1e293b',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
  },
  symbols: {
    bullet: '•',
    arrow: '→',
    check: '✓',
    cross: '✗',
    spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    separator: '─',
    selected: '▸',
    unselected: ' ',
  },
}

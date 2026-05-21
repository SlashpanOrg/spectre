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
    primary: '#818cf8',
    secondary: '#a78bfa',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    background: '#1e1e2e',
    border: '#585b70',
    highlight: '#f9e2af',
    selected: '#313244',
    codeBackground: '#313244',
    statusBarBg: '#181825',
    headerBg: '#181825',
    panelBg: '#313244',
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

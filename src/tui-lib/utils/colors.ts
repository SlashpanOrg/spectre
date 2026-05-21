import { Theme, defaultTheme } from '../types/theme.js'

export function withColor(text: string, color: string, theme: Theme = defaultTheme): string {
  const colorMap: Record<string, string> = {
    [theme.colors.primary]: '63',
    [theme.colors.secondary]: '135',
    [theme.colors.success]: '34',
    [theme.colors.warning]: '214',
    [theme.colors.error]: '203',
    [theme.colors.info]: '69',
    [theme.colors.text]: '255',
    [theme.colors.textMuted]: '245',
    [theme.colors.highlight]: '220',
  }

  const code = colorMap[color] || '255'
  return `\x1b[38;5;${code}m${text}\x1b[0m`
}

export function withBold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`
}

export function withDim(text: string): string {
  return `\x1b[2m${text}\x1b[0m`
}

export function withBg(text: string, color: string): string {
  const colorMap: Record<string, string> = {
    '#1e293b': '235',
    '#1e1b4b': '235',
    '#0f172a': '233',
  }

  const code = colorMap[color] || '235'
  return `\x1b[48;5;${code}m${text}\x1b[0m`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}

export function padRight(text: string, length: number): string {
  if (text.length >= length) return text
  return text + ' '.repeat(length - text.length)
}

export function padLeft(text: string, length: number): string {
  if (text.length >= length) return text
  return ' '.repeat(length - text.length) + text
}

export function center(text: string, width: number): string {
  if (text.length >= width) return text
  const padding = width - text.length
  const left = Math.floor(padding / 2)
  const right = padding - left
  return ' '.repeat(left) + text + ' '.repeat(right)
}

export function repeatChar(char: string, count: number): string {
  return char.repeat(count)
}

export function createProgressBar(
  current: number,
  total: number,
  width: number = 30,
): string {
  const percentage = total > 0 ? current / total : 0
  const filledWidth = Math.round(width * percentage)
  const emptyWidth = width - filledWidth

  const filled = '█'.repeat(filledWidth)
  const empty = '░'.repeat(emptyWidth)

  const pct = `${Math.round(percentage * 100)}%`

  return `[${filled}${empty}] ${pct}`
}

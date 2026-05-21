export interface KeyBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
  action: string
  description: string
}

export type KeyHandler = (key: KeyInfo) => void

export interface KeyInfo {
  key: string
  ctrl: boolean
  shift: boolean
  meta: boolean
  escape: boolean
  return: boolean
  upArrow: boolean
  downArrow: boolean
  leftArrow: boolean
  rightArrow: boolean
  tab: boolean
  backspace: boolean
  delete: boolean
  pageUp: boolean
  pageDown: boolean
}

export const DEFAULT_KEYBINDINGS: KeyBinding[] = [
  { key: 'k', ctrl: true, action: 'command_palette', description: 'Command palette' },
  { key: 'u', ctrl: true, action: 'toggle_panel', description: 'Toggle side panel' },
  { key: 'l', ctrl: true, action: 'clear', description: 'Clear chat' },
  { key: 'c', ctrl: true, action: 'cancel', description: 'Cancel operation' },
  { key: 'd', ctrl: true, action: 'quit', description: 'Quit' },
  { key: 'escape', action: 'close_modal', description: 'Close modal' },
  { key: 'tab', action: 'autocomplete', description: 'Autocomplete' },
  { key: 'up', action: 'history_up', description: 'Previous command' },
  { key: 'down', action: 'history_down', description: 'Next command' },
]

export function matchesKeyBinding(key: KeyInfo, binding: KeyBinding): boolean {
  if (binding.key.toLowerCase() !== key.key.toLowerCase() && binding.key !== key.key) {
    if (binding.key === 'up' && !key.upArrow) return false
    if (binding.key === 'down' && !key.downArrow) return false
    if (binding.key === 'left' && !key.leftArrow) return false
    if (binding.key === 'right' && !key.rightArrow) return false
    if (binding.key === 'escape' && !key.escape) return false
    if (binding.key === 'return' && !key.return) return false
    if (binding.key === 'tab' && !key.tab) return false
    if (binding.key === 'backspace' && !key.backspace) return false
  }

  if (binding.ctrl !== undefined && binding.ctrl !== key.ctrl) return false
  if (binding.shift !== undefined && binding.shift !== key.shift) return false
  if (binding.meta !== undefined && binding.meta !== key.meta) return false

  return true
}

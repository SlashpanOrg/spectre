import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { CommandPalette } from '../../src/tui-lib/index.js'

test('renders commands when visible', () => {
  const commands = [
    { id: 'help', name: '/help', description: 'Show help', execute: () => {} },
    { id: 'setup', name: '/setup', description: 'Setup provider', execute: () => {} },
  ]

  const { lastFrame } = render(
    <CommandPalette
      commands={commands}
      onSelect={() => {}}
      onClose={() => {}}
      visible={true}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('Command Palette')
  expect(output).toContain('/help')
  expect(output).toContain('/setup')
})

test('hides when not visible', () => {
  const commands = [
    { id: 'help', name: '/help', description: 'Show help', execute: () => {} },
  ]

  const { lastFrame } = render(
    <CommandPalette
      commands={commands}
      onSelect={() => {}}
      onClose={() => {}}
      visible={false}
    />,
  )

  const output = lastFrame()
  expect(output).toBe('')
})

test('shows command count', () => {
  const commands = [
    { id: 'a', name: '/a', description: 'A', execute: () => {} },
    { id: 'b', name: '/b', description: 'B', execute: () => {} },
    { id: 'c', name: '/c', description: 'C', execute: () => {} },
  ]

  const { lastFrame } = render(
    <CommandPalette
      commands={commands}
      onSelect={() => {}}
      onClose={() => {}}
      visible={true}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('3 commands')
})

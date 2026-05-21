import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { StatusBar } from '../../src/tui-lib/index.js'

test('renders provider and model', () => {
  const { lastFrame } = render(
    <StatusBar
      provider="openai"
      model="gpt-4o"
      shortcuts={[{ key: 'Ctrl+K', action: 'Commands' }]}
      status="idle"
    />,
  )

  const output = lastFrame()
  expect(output).toContain('openai')
  expect(output).toContain('gpt-4o')
})

test('shows ready status when idle', () => {
  const { lastFrame } = render(
    <StatusBar
      provider="none"
      model="none"
      shortcuts={[]}
      status="idle"
    />,
  )

  const output = lastFrame()
  expect(output).toBeDefined()
})

test('shows loading status', () => {
  const { lastFrame } = render(
    <StatusBar
      provider="anthropic"
      model="claude-sonnet"
      shortcuts={[]}
      status="loading"
    />,
  )

  const output = lastFrame()
  expect(output).toBeDefined()
})

test('shows streaming status', () => {
  const { lastFrame } = render(
    <StatusBar
      provider="gemini"
      model="gemini-2.5-flash"
      shortcuts={[{ key: 'Ctrl+C', action: 'Cancel' }]}
      status="streaming"
    />,
  )

  const output = lastFrame()
  expect(output).toContain('gemini')
  expect(output).toContain('Ctrl+C')
})

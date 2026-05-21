import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Message } from '../../src/tui-lib/index.js'

test('renders user message', () => {
  const { lastFrame } = render(
    <Message
      message={{
        id: '1',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date(),
      }}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('You')
  expect(output).toContain('Hello world')
})

test('renders assistant message', () => {
  const { lastFrame } = render(
    <Message
      message={{
        id: '2',
        role: 'assistant',
        content: 'Here is the code:\n\n```typescript\nconst x = 1;\n```',
        timestamp: new Date(),
      }}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('AI')
  expect(output).toContain('Here is the code')
})

test('renders streaming indicator', () => {
  const { lastFrame } = render(
    <Message
      message={{
        id: '3',
        role: 'assistant',
        content: 'Thinking...',
        timestamp: new Date(),
        isStreaming: true,
      }}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('AI')
})

test('renders system message dimmed', () => {
  const { lastFrame } = render(
    <Message
      message={{
        id: '4',
        role: 'system',
        content: 'System notification',
        timestamp: new Date(),
      }}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('System notification')
})

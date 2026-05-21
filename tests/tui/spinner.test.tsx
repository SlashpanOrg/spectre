import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Spinner } from '../../src/tui-lib/index.js'

test('renders spinner with label', () => {
  const { lastFrame } = render(
    <Spinner label="Loading..." visible={true} />,
  )

  const output = lastFrame()
  expect(output).toContain('Loading...')
})

test('hides when not visible', () => {
  const { lastFrame } = render(
    <Spinner label="Hidden" visible={false} />,
  )

  const output = lastFrame()
  expect(output).toBe('')
})

test('renders without label', () => {
  const { lastFrame } = render(
    <Spinner visible={true} />,
  )

  const output = lastFrame()
  expect(output).toBeDefined()
})

import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { ProgressIndicator } from '../../src/tui-lib/index.js'

test('renders progress bar with percentage', () => {
  const { lastFrame } = render(
    <ProgressIndicator
      current={5}
      total={10}
      label="Indexing"
      step="Processing commits"
      visible={true}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('Indexing')
  expect(output).toContain('50%')
  expect(output).toContain('Processing commits')
})

test('renders spinner animation', () => {
  const { lastFrame } = render(
    <ProgressIndicator
      current={0}
      total={100}
      label="Loading"
      visible={true}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('Loading')
})

test('hides when not visible', () => {
  const { lastFrame } = render(
    <ProgressIndicator
      current={50}
      total={100}
      label="Hidden"
      visible={false}
    />,
  )

  const output = lastFrame()
  expect(output).toBe('')
})

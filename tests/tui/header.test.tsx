import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Header } from '../../src/tui-lib/index.js'

test('renders title and version', () => {
  const { lastFrame } = render(
    <Header title="SPECTRE" version="0.1.0" />,
  )

  const output = lastFrame()
  expect(output).toContain('SPECTRE')
  expect(output).toContain('0.1.0')
})

test('renders provider and model info', () => {
  const { lastFrame } = render(
    <Header
      title="SPECTRE"
      provider="openai"
      model="gpt-4o"
    />,
  )

  const output = lastFrame()
  expect(output).toContain('openai')
  expect(output).toContain('gpt-4o')
})

test('renders subtitle', () => {
  const { lastFrame } = render(
    <Header
      title="NEXUS"
      subtitle="Multi-Agent Workflow Orchestrator"
    />,
  )

  const output = lastFrame()
  expect(output).toContain('Multi-Agent Workflow Orchestrator')
})

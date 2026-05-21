import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { CodeBlock } from '../../src/tui-lib/index.js'

test('renders code with language label', () => {
  const { lastFrame } = render(
    <CodeBlock code="const x = 1;" language="typescript" />,
  )

  const output = lastFrame()
  expect(output).toContain('typescript')
  expect(output).toContain('const')
})

test('renders multi-line code with line numbers', () => {
  const code = `function hello() {
  return "world";
}`

  const { lastFrame } = render(
    <CodeBlock code={code} language="typescript" />,
  )

  const output = lastFrame()
  expect(output).toContain('1')
  expect(output).toContain('2')
  expect(output).toContain('3')
})

test('renders without language', () => {
  const { lastFrame } = render(
    <CodeBlock code="plain text" />,
  )

  const output = lastFrame()
  expect(output).toContain('plain text')
})

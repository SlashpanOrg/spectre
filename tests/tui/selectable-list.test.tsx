import React from 'react'
import { test, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { SelectableList } from '../../src/tui-lib/index.js'

test('renders list items', () => {
  const items = ['model-a', 'model-b', 'model-c']
  const { lastFrame } = render(
    <SelectableList
      items={items}
      renderItem={(item, _idx, selected) => (
        <Text>{selected ? `> ${item}` : `  ${item}`}</Text>
      )}
      onSelect={() => {}}
      maxVisible={10}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('model-a')
  expect(output).toContain('model-b')
  expect(output).toContain('model-c')
})

test('highlights selected item', () => {
  const items = ['first', 'second', 'third']
  const { lastFrame } = render(
    <SelectableList
      items={items}
      renderItem={(_item, idx, selected) => (
        <Text>{selected ? `[selected-${idx}]` : `[normal-${idx}]`}</Text>
      )}
      onSelect={() => {}}
      initialIndex={1}
      maxVisible={10}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('[selected-1]')
})

test('shows title and item count', () => {
  const items = ['a', 'b', 'c', 'd', 'e']
  const { lastFrame } = render(
    <SelectableList
      items={items}
      renderItem={(item) => <Text>{item}</Text>}
      onSelect={() => {}}
      title="Select Model"
      maxVisible={10}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('Select Model')
  expect(output).toContain('5 items')
})

test('filters items when filter is applied via props', () => {
  const items = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet', 'claude-haiku']
  const { lastFrame } = render(
    <SelectableList
      items={items}
      renderItem={(item) => <Text>{item}</Text>}
      onSelect={() => {}}
      title="Models"
      maxVisible={10}
    />,
  )

  const output = lastFrame()
  expect(output).toContain('gpt-4o')
  expect(output).toContain('claude-sonnet')
})

import React, { useState, useMemo, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { SelectableListProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'
import { useScroll } from '../hooks/useScroll.js'
import { fuzzyFilter } from '../utils/fuzzy.js'

export function SelectableList<T = string>({
  items,
  renderItem,
  onSelect,
  onCancel,
  title,
  initialIndex = 0,
  maxVisible = 10,
  theme = defaultTheme,
}: SelectableListProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [filter, setFilter] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)

  const filteredItems = useMemo(() => {
    if (!filter.trim()) return items.map((item) => ({ item, score: 0 }))
    return fuzzyFilter(items, filter, (item) => String(item))
  }, [items, filter])

  const displayItems = filteredItems.map((f) => f.item)
  const { scrollOffset, maxOffset, visibleStart, visibleEnd, scrollUp, scrollDown } = useScroll(
    displayItems.length,
    maxVisible,
  )

  const handleSelect = useCallback(() => {
    const actualIndex = visibleStart + selectedIndex
    if (actualIndex < displayItems.length) {
      onSelect(displayItems[actualIndex], actualIndex)
    }
  }, [selectedIndex, visibleStart, displayItems, onSelect])

  useInput(
    (input, key) => {
      if (isFiltering) {
        if (key.return) {
          setIsFiltering(false)
          handleSelect()
          return
        }
        if (key.escape) {
          setFilter('')
          setIsFiltering(false)
          setSelectedIndex(0)
          return
        }
        if (key.backspace) {
          setFilter((prev) => prev.slice(0, -1))
          setSelectedIndex(0)
          return
        }
        if (input.length === 1 && !key.ctrl && !key.meta) {
          setFilter((prev) => prev + input)
          setSelectedIndex(0)
          return
        }
        return
      }

      if (key.upArrow) {
        if (selectedIndex > 0) {
          setSelectedIndex((prev) => prev - 1)
        } else if (scrollOffset > 0) {
          scrollUp()
        }
      } else if (key.downArrow) {
        const visibleCount = visibleEnd - visibleStart
        if (
          selectedIndex < visibleCount - 1 &&
          visibleStart + selectedIndex < displayItems.length - 1
        ) {
          setSelectedIndex((prev) => prev + 1)
        } else if (scrollOffset < maxOffset) {
          scrollDown()
        }
      } else if (key.return) {
        handleSelect()
      } else if (key.escape) {
        onCancel?.()
      } else if (key.tab) {
        setIsFiltering(true)
      } else if (input === '/' && !isFiltering) {
        setIsFiltering(true)
      } else if (input.length === 1 && !key.ctrl && !key.meta) {
        setFilter(input)
        setIsFiltering(true)
        setSelectedIndex(0)
      }
    },
    { isActive: true },
  )

  const colors = theme.colors
  const visibleItems = displayItems.slice(visibleStart, visibleEnd)
  const hasScroll = displayItems.length > maxVisible

  return (
    <Box flexDirection="column" width="100%">
      {title && (
        <Box paddingX={1} paddingY={1}>
          <Text bold color={colors.primary}>
            {title}
          </Text>
          <Text color={colors.textMuted}> ({displayItems.length} items)</Text>
        </Box>
      )}

      {isFiltering && (
        <Box paddingX={2} paddingY={0}>
          <Text color={colors.highlight}>{`>`} </Text>
          <Text color={colors.text} bold>
            {filter}
          </Text>
          <Text color={colors.textMuted}> │ Tab to exit filter</Text>
        </Box>
      )}

      <Box flexDirection="column" width="100%">
        {visibleItems.map((item, idx) => {
          const actualIndex = visibleStart + idx
          const isSelected = actualIndex === visibleStart + selectedIndex
          return (
            <Box key={actualIndex} paddingX={1}>
              {renderItem(item, actualIndex, isSelected)}
            </Box>
          )
        })}
      </Box>

      {hasScroll && (
        <Box paddingX={2} paddingY={0} justifyContent="center">
          <Text color={colors.textMuted}>
            {`↑`} {visibleStart + 1}-{visibleEnd} of {displayItems.length} {`↓`}
          </Text>
        </Box>
      )}

      <Box paddingX={2} paddingY={1}>
        <Text color={colors.textMuted} dimColor>
          {isFiltering
            ? 'Enter: select | Esc: clear filter'
            : '↑↓: navigate | Enter: select | Tab or /: filter | Esc: cancel'}
        </Text>
      </Box>
    </Box>
  )
}

import { useState, useCallback } from 'react'

export interface UseScrollReturn {
  scrollOffset: number
  maxOffset: number
  visibleStart: number
  visibleEnd: number
  scrollUp: () => void
  scrollDown: () => void
  scrollTo: (offset: number) => void
  scrollToTop: () => void
  scrollToBottom: () => void
  setViewportSize: (size: number) => void
}

export function useScroll(totalItems: number, viewportSize: number): UseScrollReturn {
  const [scrollOffset, setScrollOffset] = useState(0)
  const [currentViewport, setCurrentViewport] = useState(viewportSize)

  const effectiveViewport = Math.min(currentViewport, totalItems)
  const maxOffset = Math.max(0, totalItems - effectiveViewport)

  const visibleStart = Math.min(scrollOffset, maxOffset)
  const visibleEnd = Math.min(visibleStart + effectiveViewport, totalItems)

  const scrollUp = useCallback(() => {
    setScrollOffset((prev) => Math.max(0, prev - 1))
  }, [])

  const scrollDown = useCallback(() => {
    setScrollOffset((prev) => Math.min(maxOffset, prev + 1))
  }, [maxOffset])

  const scrollTo = useCallback(
    (offset: number) => {
      setScrollOffset(() => Math.max(0, Math.min(maxOffset, offset)))
    },
    [maxOffset],
  )

  const scrollToTop = useCallback(() => {
    setScrollOffset(0)
  }, [])

  const scrollToBottom = useCallback(() => {
    setScrollOffset(maxOffset)
  }, [maxOffset])

  const setViewportSize = useCallback((size: number) => {
    setCurrentViewport(size)
    setScrollOffset(0)
  }, [])

  return {
    scrollOffset,
    maxOffset,
    visibleStart,
    visibleEnd,
    scrollUp,
    scrollDown,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    setViewportSize,
  }
}

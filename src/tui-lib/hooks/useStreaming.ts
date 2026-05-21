import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseStreamingReturn {
  content: string
  isStreaming: boolean
  startStream: () => void
  appendToken: (token: string) => void
  endStream: () => void
  reset: () => void
}

export function useStreaming(initialContent: string = ''): UseStreamingReturn {
  const [content, setContent] = useState(initialContent)
  const [isStreaming, setIsStreaming] = useState(false)
  const bufferRef = useRef('')
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const flushBuffer = useCallback(() => {
    if (bufferRef.current) {
      setContent((prev) => prev + bufferRef.current)
      bufferRef.current = ''
    }
  }, [])

  const startStream = useCallback(() => {
    setIsStreaming(true)
    bufferRef.current = ''

    flushIntervalRef.current = setInterval(() => {
      flushBuffer()
    }, 50)
  }, [flushBuffer])

  const appendToken = useCallback(
    (token: string) => {
      if (!isStreaming) return
      bufferRef.current += token
    },
    [isStreaming],
  )

  const endStream = useCallback(() => {
    setIsStreaming(false)
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current)
      flushIntervalRef.current = null
    }
    flushBuffer()
  }, [flushBuffer])

  const reset = useCallback(() => {
    setIsStreaming(false)
    setContent('')
    bufferRef.current = ''
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current)
      flushIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current)
      }
    }
  }, [])

  return {
    content,
    isStreaming,
    startStream,
    appendToken,
    endStream,
    reset,
  }
}

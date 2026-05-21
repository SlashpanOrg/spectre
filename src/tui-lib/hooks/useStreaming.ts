import { useState, useCallback, useRef } from 'react'

export interface UseStreamingReturn {
  isStreaming: boolean
  content: string
  startStream: (streamFn: () => AsyncIterable<string>) => Promise<void>
  cancelStream: () => void
  resetStream: () => void
}

export function useStreaming(): UseStreamingReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [content, setContent] = useState('')
  const abortRef = useRef(false)

  const startStream = useCallback(async (streamFn: () => AsyncIterable<string>) => {
    abortRef.current = false
    setIsStreaming(true)
    setContent('')

    try {
      const stream = streamFn()
      let accumulated = ''

      for await (const token of stream) {
        if (abortRef.current) break
        accumulated += token
        setContent(accumulated)
      }
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const cancelStream = useCallback(() => {
    abortRef.current = true
  }, [])

  const resetStream = useCallback(() => {
    abortRef.current = true
    setIsStreaming(false)
    setContent('')
  }, [])

  return {
    isStreaming,
    content,
    startStream,
    cancelStream,
    resetStream,
  }
}

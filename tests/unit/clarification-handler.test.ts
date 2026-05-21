import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ClarificationHandler } from '../../src/agent/clarification-handler.js'

describe('ClarificationHandler', () => {
  let handler: ClarificationHandler

  beforeEach(() => {
    handler = new ClarificationHandler()
  })

  it('should throw error when no callback is set', async () => {
    await expect(handler.requestClarification('What do you mean?')).rejects.toThrow(
      'No clarification handler available',
    )
  })

  it('should resolve clarification with callback', async () => {
    const callback = vi.fn().mockResolvedValue('I mean the specific implementation')

    handler.setCallback(callback)

    const result = await handler.requestClarification('What do you mean?')

    expect(result).toBe('I mean the specific implementation')
    expect(callback).toHaveBeenCalledWith('What do you mean?', '')
  })

  it('should timeout after specified duration', async () => {
    vi.useFakeTimers()

    const callback = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('response'), 10000)),
    )

    handler.setCallback(callback)

    const promise = handler.requestClarification('Question?', '', 1000)
    vi.advanceTimersByTime(1100)

    await expect(promise).rejects.toThrow('Clarification timeout')

    vi.useRealTimers()
  })

  it('should track active request', async () => {
    const callback = vi.fn().mockResolvedValue('response')
    handler.setCallback(callback)

    const promise = handler.requestClarification('Question?')

    expect(handler.hasActiveRequest()).toBe(true)
    expect(handler.getActiveRequest()?.question).toBe('Question?')

    await promise

    expect(handler.hasActiveRequest()).toBe(false)
  })

  it('should cancel active request', async () => {
    const callback = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('response'), 10000)),
    )

    handler.setCallback(callback)
    handler.requestClarification('Question?')

    expect(handler.hasActiveRequest()).toBe(true)

    handler.cancelClarification()

    expect(handler.hasActiveRequest()).toBe(false)
  })

  it('should resolve previous request when new one starts', async () => {
    const callback = vi.fn().mockResolvedValue('response')
    handler.setCallback(callback)

    handler.requestClarification('Question 1?')
    expect(handler.hasActiveRequest()).toBe(true)

    handler.requestClarification('Question 2?')
    expect(handler.getActiveRequest()?.question).toBe('Question 2?')
  })

  it('should clear all state', async () => {
    const callback = vi.fn().mockResolvedValue('response')
    handler.setCallback(callback)

    handler.requestClarification('Question?')
    handler.clear()

    expect(handler.hasActiveRequest()).toBe(false)
    expect(handler.getActiveRequest()).toBeNull()
  })
})

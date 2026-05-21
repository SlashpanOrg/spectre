import { describe, it, expect } from 'vitest'
import { TokenTracker } from '../../src/utils/token-tracker.js'

describe('TokenTracker', () => {
  it('should start with zero usage', () => {
    const tracker = new TokenTracker()
    const state = tracker.getState()

    expect(state.currentSession.promptTokens).toBe(0)
    expect(state.currentSession.completionTokens).toBe(0)
    expect(state.currentSession.totalTokens).toBe(0)
  })

  it('should add token usage', () => {
    const tracker = new TokenTracker()
    tracker.addUsage({ promptTokens: 100, completionTokens: 50 })

    const state = tracker.getState()
    expect(state.currentSession.promptTokens).toBe(100)
    expect(state.currentSession.completionTokens).toBe(50)
    expect(state.currentSession.totalTokens).toBe(150)
  })

  it('should accumulate usage across multiple calls', () => {
    const tracker = new TokenTracker()
    tracker.addUsage({ promptTokens: 100, completionTokens: 50 })
    tracker.addUsage({ promptTokens: 200, completionTokens: 100 })

    const state = tracker.getState()
    expect(state.currentSession.promptTokens).toBe(300)
    expect(state.currentSession.completionTokens).toBe(150)
    expect(state.currentSession.totalTokens).toBe(450)
  })

  it('should calculate usage percentage', () => {
    const tracker = new TokenTracker(10000)
    tracker.addUsage({ totalTokens: 5000 })

    expect(tracker.getUsagePercentage()).toBe(50)
  })

  it('should cap percentage at 100', () => {
    const tracker = new TokenTracker(1000)
    tracker.addUsage({ totalTokens: 2000 })

    expect(tracker.getUsagePercentage()).toBe(100)
  })

  it('should calculate remaining tokens', () => {
    const tracker = new TokenTracker(10000)
    tracker.addUsage({ totalTokens: 3000 })

    expect(tracker.getRemainingTokens()).toBe(7000)
  })

  it('should not return negative remaining tokens', () => {
    const tracker = new TokenTracker(1000)
    tracker.addUsage({ totalTokens: 2000 })

    expect(tracker.getRemainingTokens()).toBe(0)
  })

  it('should detect near limit', () => {
    const tracker = new TokenTracker(10000)
    tracker.addUsage({ totalTokens: 8000 })

    expect(tracker.isNearLimit(0.8)).toBe(true)
    expect(tracker.isNearLimit(0.9)).toBe(false)
  })

  it('should reset usage', () => {
    const tracker = new TokenTracker()
    tracker.addUsage({ promptTokens: 100, completionTokens: 50 })
    tracker.reset()

    const state = tracker.getState()
    expect(state.currentSession.totalTokens).toBe(0)
  })

  it('should update context window', () => {
    const tracker = new TokenTracker(10000)
    tracker.setContextWindow(20000)

    const state = tracker.getState()
    expect(state.modelContextWindow).toBe(20000)
  })

  it('should estimate tokens from text', () => {
    const text = 'Hello, world! This is a test.'
    const estimated = TokenTracker.estimateTokens(text)

    expect(estimated).toBeGreaterThan(0)
    expect(estimated).toBeLessThanOrEqual(text.length)
  })
})

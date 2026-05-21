import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TaskTimer } from '../../src/utils/task-timer.js'

describe('TaskTimer', () => {
  let timer: TaskTimer

  beforeEach(() => {
    vi.useFakeTimers()
    timer = new TaskTimer()
  })

  afterEach(() => {
    vi.useRealTimers()
    timer.stop()
  })

  it('should start in stopped state', () => {
    const state = timer.getState()
    expect(state.isRunning).toBe(false)
    expect(state.elapsedTime).toBe(0)
  })

  it('should start and track elapsed time', () => {
    timer.start()
    vi.advanceTimersByTime(5000)

    const elapsed = timer.getElapsed()
    expect(elapsed).toBeGreaterThanOrEqual(5000)
  })

  it('should format elapsed time as mm:ss', () => {
    timer.start()
    vi.advanceTimersByTime(65000)

    expect(timer.formatElapsed()).toBe('01:05')
  })

  it('should format zero time as 00:00', () => {
    expect(timer.formatElapsed()).toBe('00:00')
  })

  it('should pause and resume', () => {
    timer.start()
    vi.advanceTimersByTime(10000)
    timer.pause()

    const pausedTime = timer.getElapsed()
    vi.advanceTimersByTime(10000)

    expect(timer.getElapsed()).toBe(pausedTime)

    timer.resume()
    vi.advanceTimersByTime(5000)

    expect(timer.getElapsed()).toBeGreaterThanOrEqual(pausedTime + 5000)
  })

  it('should stop and preserve elapsed time', () => {
    timer.start()
    vi.advanceTimersByTime(10000)
    timer.stop()

    const stoppedTime = timer.getElapsed()
    vi.advanceTimersByTime(10000)

    expect(timer.getElapsed()).toBe(stoppedTime)
    expect(timer.getState().isRunning).toBe(false)
  })

  it('should reset to zero', () => {
    timer.start()
    vi.advanceTimersByTime(10000)
    timer.reset()

    expect(timer.getElapsed()).toBe(0)
    expect(timer.getState().isRunning).toBe(false)
  })

  it('should call onTick callback every second', () => {
    const onTick = vi.fn()
    const timerWithCallback = new TaskTimer(onTick)

    timerWithCallback.start()
    vi.advanceTimersByTime(3000)

    expect(onTick).toHaveBeenCalledTimes(3)
    timerWithCallback.stop()
  })

  it('should not start twice', () => {
    timer.start()
    timer.start()

    expect(timer.getState().isRunning).toBe(true)
  })

  it('should handle pause when not running', () => {
    timer.pause()
    expect(timer.getState().isPaused).toBe(false)
  })

  it('should handle resume when not paused', () => {
    timer.start()
    timer.resume()
    expect(timer.getState().isPaused).toBe(false)
  })
})

export interface TaskTimerState {
  startTime: number | null
  elapsedTime: number
  isRunning: boolean
  isPaused: boolean
}

export class TaskTimer {
  private state: TaskTimerState
  private intervalId: NodeJS.Timeout | null = null
  private onTick?: (elapsed: number) => void

  constructor(onTick?: (elapsed: number) => void) {
    this.state = {
      startTime: null,
      elapsedTime: 0,
      isRunning: false,
      isPaused: false,
    }
    this.onTick = onTick
  }

  start(): void {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.state.isPaused = false
    this.state.startTime = Date.now() - this.state.elapsedTime

    this.intervalId = setInterval(() => {
      if (this.state.isRunning && !this.state.isPaused) {
        this.state.elapsedTime = Date.now() - (this.state.startTime || Date.now())
        if (this.onTick) {
          this.onTick(this.state.elapsedTime)
        }
      }
    }, 1000)
  }

  pause(): void {
    if (!this.state.isRunning || this.state.isPaused) return
    this.state.isPaused = true
  }

  resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) return
    this.state.isPaused = false
    this.state.startTime = Date.now() - this.state.elapsedTime
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.state.isRunning = false
    this.state.isPaused = false
    this.state.startTime = null
  }

  reset(): void {
    this.stop()
    this.state.elapsedTime = 0
  }

  getElapsed(): number {
    if (this.state.isRunning && !this.state.isPaused && this.state.startTime) {
      return Date.now() - this.state.startTime
    }
    return this.state.elapsedTime
  }

  formatElapsed(): string {
    const totalSeconds = Math.floor(this.getElapsed() / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  getState(): TaskTimerState {
    return { ...this.state }
  }
}

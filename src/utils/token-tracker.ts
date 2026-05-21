export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface TokenTrackerState {
  currentSession: TokenUsage
  modelContextWindow: number
}

export class TokenTracker {
  private state: TokenTrackerState

  constructor(modelContextWindow: number = 128000) {
    this.state = {
      currentSession: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      modelContextWindow,
    }
  }

  addUsage(usage: Partial<TokenUsage>): void {
    if (usage.promptTokens !== undefined) {
      this.state.currentSession.promptTokens += usage.promptTokens
    }
    if (usage.completionTokens !== undefined) {
      this.state.currentSession.completionTokens += usage.completionTokens
    }
    if (usage.totalTokens !== undefined) {
      this.state.currentSession.totalTokens = usage.totalTokens
    } else {
      this.state.currentSession.totalTokens =
        this.state.currentSession.promptTokens + this.state.currentSession.completionTokens
    }
  }

  getState(): TokenTrackerState {
    return { ...this.state }
  }

  getUsagePercentage(): number {
    if (this.state.modelContextWindow === 0) return 0
    return Math.min(100, Math.round((this.state.currentSession.totalTokens / this.state.modelContextWindow) * 100))
  }

  getRemainingTokens(): number {
    return Math.max(0, this.state.modelContextWindow - this.state.currentSession.totalTokens)
  }

  isNearLimit(threshold: number = 0.8): boolean {
    return this.getUsagePercentage() >= threshold * 100
  }

  reset(): void {
    this.state.currentSession = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  }

  setContextWindow(size: number): void {
    this.state.modelContextWindow = size
  }

  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

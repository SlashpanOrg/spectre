import { AIProvider } from '../ai/provider.js'
import { ToolRegistry } from './tools/registry.js'
import { PermissionManager } from './permissions.js'
import { TokenTracker } from '../utils/token-tracker.js'
import { TaskTimer } from '../utils/task-timer.js'
import { logger } from '../utils/logger.js'

export interface SubAgentTask {
  id: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'interrupted'
  result?: string
  error?: string
  tokensUsed: number
  timeElapsed: number
}

export interface SubAgentResult {
  taskId: string
  success: boolean
  result: string
  error?: string
  tokensUsed: number
  timeElapsed: number
}

export type SubAgentStatusCallback = (taskId: string, status: SubAgentTask) => void

export class SubAgent {
  private id: string
  private provider: AIProvider
  private toolRegistry: ToolRegistry
  private permissionManager: PermissionManager
  private tokenTracker: TokenTracker
  private timer: TaskTimer
  private currentTask: SubAgentTask | null = null
  private interrupted = false

  constructor(
    id: string,
    provider: AIProvider,
    toolRegistry: ToolRegistry,
    permissionManager: PermissionManager,
    _projectDir: string = process.cwd(),
  ) {
    this.id = id
    this.provider = provider
    this.toolRegistry = toolRegistry
    this.permissionManager = permissionManager
    this.tokenTracker = new TokenTracker()
    this.timer = new TaskTimer()
  }

  async execute(
    taskDescription: string,
    onStatus?: SubAgentStatusCallback,
  ): Promise<SubAgentResult> {
    this.interrupted = false
    this.timer.reset()
    this.timer.start()

    this.currentTask = {
      id: this.id,
      description: taskDescription,
      status: 'running',
      tokensUsed: 0,
      timeElapsed: 0,
    }

    if (onStatus) {
      onStatus(this.id, this.currentTask)
    }

    try {
      const systemPrompt = `You are a sub-agent of Spectre. Your task is: ${taskDescription}

Use the available tools to complete this task. Be concise and focused.
Report your final result clearly.`

      const response = await this.provider.generateCompletion(
        `Task: ${taskDescription}`,
        {
          systemPrompt,
          temperature: 0.3,
          maxTokens: 4096,
        },
      )

      const elapsed = this.timer.getElapsed()
      const tokens = this.tokenTracker.getState().currentSession.totalTokens

      if (this.currentTask) {
        this.currentTask.status = this.interrupted ? 'interrupted' : 'completed'
        this.currentTask.result = response
        this.currentTask.tokensUsed = tokens
        this.currentTask.timeElapsed = elapsed
      }

      if (onStatus && this.currentTask) {
        onStatus(this.id, this.currentTask)
      }

      return {
        taskId: this.id,
        success: !this.interrupted,
        result: response,
        tokensUsed: tokens,
        timeElapsed: elapsed,
      }
    } catch (error) {
      const elapsed = this.timer.getElapsed()
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (this.currentTask) {
        this.currentTask.status = 'failed'
        this.currentTask.error = errorMessage
        this.currentTask.timeElapsed = elapsed
      }

      if (onStatus && this.currentTask) {
        onStatus(this.id, this.currentTask)
      }

      logger.warn(`Sub-agent ${this.id} failed: ${errorMessage}`)

      return {
        taskId: this.id,
        success: false,
        result: '',
        error: errorMessage,
        tokensUsed: 0,
        timeElapsed: elapsed,
      }
    } finally {
      this.timer.stop()
    }
  }

  interrupt(): void {
    this.interrupted = true
    if (this.currentTask) {
      this.currentTask.status = 'interrupted'
    }
  }

  getId(): string {
    return this.id
  }

  getCurrentTask(): SubAgentTask | null {
    return this.currentTask
  }
}

export class SubAgentOrchestrator {
  private provider: AIProvider
  private toolRegistry: ToolRegistry
  private permissionManager: PermissionManager
  private activeAgents: Map<string, SubAgent> = new Map()
  private maxConcurrent: number

  constructor(
    provider: AIProvider,
    toolRegistry: ToolRegistry,
    projectDir: string = process.cwd(),
    maxConcurrent: number = 3,
  ) {
    this.provider = provider
    this.toolRegistry = toolRegistry
    this.permissionManager = new PermissionManager(projectDir)
    this.maxConcurrent = maxConcurrent
  }

  async spawnTasks(
    tasks: { id: string; description: string }[],
    onStatus?: SubAgentStatusCallback,
  ): Promise<SubAgentResult[]> {
    const results: SubAgentResult[] = []
    const batches: typeof tasks[] = []

    for (let i = 0; i < tasks.length; i += this.maxConcurrent) {
      batches.push(tasks.slice(i, i + this.maxConcurrent))
    }

    for (const batch of batches) {
      const batchPromises = batch.map((task) => {
        const agent = new SubAgent(
          task.id,
          this.provider,
          this.toolRegistry,
          this.permissionManager,
        )
        this.activeAgents.set(task.id, agent)

        return agent.execute(task.description, onStatus).finally(() => {
          this.activeAgents.delete(task.id)
        })
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  getActiveAgents(): Map<string, SubAgent> {
    return new Map(this.activeAgents)
  }

  interruptAll(): void {
    for (const agent of this.activeAgents.values()) {
      agent.interrupt()
    }
  }

  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max
  }
}

import { AIProvider } from '../ai/provider.js'
import { logger } from '../utils/logger.js'

export interface AgentStep {
  id: string
  description: string
  tool: string
  args: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
}

export interface AgentTask {
  id: string
  description: string
  steps: AgentStep[]
  status: 'planning' | 'running' | 'completed' | 'failed' | 'interrupted'
  result?: string
}

export type ProgressCallback = (task: AgentTask) => void
export type ClarificationCallback = (question: string) => Promise<string>
export type ToolExecutor = (tool: string, args: string) => Promise<string>

export class AgentOrchestrator {
  private provider: AIProvider
  private toolExecutor?: ToolExecutor
  private currentTask: AgentTask | null = null
  private interrupted = false

  constructor(provider: AIProvider, toolExecutor?: ToolExecutor) {
    this.provider = provider
    this.toolExecutor = toolExecutor
  }

  async execute(
    userInput: string,
    onProgress?: ProgressCallback,
    onClarification?: ClarificationCallback,
  ): Promise<AgentTask> {
    this.interrupted = false
    const task: AgentTask = {
      id: `task-${Date.now()}`,
      description: userInput,
      steps: [],
      status: 'planning',
    }

    this.currentTask = task

    // Step 1: Plan
    task.steps = await this.planSteps(userInput)
    task.status = 'running'
    if (onProgress) onProgress(task)

    // Step 2: Execute steps
    for (let i = 0; i < task.steps.length; i++) {
      if (this.interrupted) {
        task.status = 'interrupted'
        if (onProgress) onProgress(task)
        return task
      }

      const step = task.steps[i]
      step.status = 'running'
      if (onProgress) onProgress(task)

      // Check if step needs clarification
      if (step.tool === 'clarify') {
        if (onClarification) {
          step.result = await onClarification(step.args)
          step.status = 'completed'
        } else {
          step.status = 'failed'
          step.error = 'No clarification handler available'
        }
        if (onProgress) onProgress(task)
        continue
      }

      // Execute tool
      try {
        step.result = await this.executeTool(step.tool, step.args)
        step.status = 'completed'
      } catch (error) {
        step.status = 'failed'
        step.error = error instanceof Error ? error.message : String(error)
        logger.warn(`Step ${step.id} failed: ${step.error}`)
      }

      if (onProgress) onProgress(task)
    }

    // Check if all steps completed
    const allCompleted = task.steps.every((s) => s.status === 'completed')
    const anyFailed = task.steps.some((s) => s.status === 'failed')

    if (this.interrupted) {
      task.status = 'interrupted'
    } else if (anyFailed) {
      task.status = 'failed'
    } else if (allCompleted) {
      task.status = 'completed'
      task.result = await this.generateSummary(task)
    }

    if (onProgress) onProgress(task)
    return task
  }

  interrupt(): void {
    this.interrupted = true
    if (this.currentTask) {
      this.currentTask.status = 'interrupted'
    }
  }

  private async planSteps(userInput: string): Promise<AgentStep[]> {
    const prompt = `You are Spectre, an AI agent that breaks down complex requests into executable steps.

Available tools:
- index: Index a Git repository (/index)
- query: Ask questions about indexed codebase (/query)
- review: Review branch changes (/review)
- debt: Analyze technical debt (/debt)
- docs: Generate documentation (/docs <type>)
- clarify: Ask user for clarification

User request: "${userInput}"

Break this down into sequential steps. Each step should use one tool.
If the request is ambiguous, add a 'clarify' step first.

Respond with ONLY a JSON array of steps. Each step:
- "id": unique step ID (e.g., "step-1")
- "description": what this step does
- "tool": tool name from the list above
- "args": arguments to pass to the tool

Return ONLY valid JSON.`

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
    })

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const steps = JSON.parse(jsonMatch[0]) as Omit<AgentStep, 'status'>[]
      return steps.map((s) => ({ ...s, status: 'pending' as const }))
    } catch {
      logger.warn('Failed to parse agent plan, creating single step')
      return [
        {
          id: 'step-1',
          description: userInput,
          tool: 'clarify',
          args: `How should I handle: "${userInput}"?`,
          status: 'pending',
        },
      ]
    }
  }

  private async executeTool(tool: string, args: string): Promise<string> {
    if (!this.toolExecutor) {
      throw new Error('No tool executor configured for agent task execution')
    }
    return this.toolExecutor(tool, args)
  }

  private async generateSummary(task: AgentTask): Promise<string> {
    const completedSteps = task.steps.filter((s) => s.status === 'completed').length
    const totalSteps = task.steps.length

    return `Task completed: ${completedSteps}/${totalSteps} steps successful.`
  }

  async *queryStream(userInput: string, systemPrompt?: string): AsyncIterable<string> {
    const prompt = `You are Spectre, an AI development intelligence agent.
Be concise and helpful. Focus on code analysis, architecture, and development tasks.

User: ${userInput}`

    yield* this.provider.generateCompletionStream(prompt, {
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt,
    })
  }
}

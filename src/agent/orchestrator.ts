import { AIProvider } from '../ai/provider.js'
import { ToolRegistry } from './tools/registry.js'
import { ToolInput, ToolResult } from './tools/types.js'
import { PermissionManager } from './permissions.js'
import { TokenTracker } from '../utils/token-tracker.js'
import { TaskTimer } from '../utils/task-timer.js'
import { SessionCompactor } from './compactor.js'
import { MemoryManager } from './memory.js'
import { SubAgentOrchestrator, SubAgentStatusCallback } from './sub-agent.js'
import { ErrorLearner } from './error-learner.js'
import { ClarificationHandler, ClarificationCallback } from './clarification-handler.js'
import { modelProfileManager } from '../ai/model-profiles.js'
import { markModelUnavailable } from '../ai/model-discovery.js'
import { executeWithRetry } from './retry-handler.js'
import { logger } from '../utils/logger.js'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  tool_name?: string
}

export interface ToolCall {
  id: string
  name: string
  arguments: ToolInput
}

export interface ConversationState {
  messages: ConversationMessage[]
  tokenUsage: number
  isCompacting: boolean
}

export type StreamCallback = (chunk: string) => void
export type ToolCallback = (tool: string, args: ToolInput) => Promise<ToolResult>
export type PermissionCallback = (tool: string, pattern: string) => Promise<'once' | 'always' | 'declined'>

export class AgentOrchestrator {
  private provider: AIProvider
  private toolRegistry: ToolRegistry
  private permissionManager: PermissionManager
  private tokenTracker: TokenTracker
  private taskTimer: TaskTimer
  private compactor: SessionCompactor
  private memoryManager: MemoryManager
  private errorLearner: ErrorLearner
  private clarificationHandler: ClarificationHandler
  private subAgentOrchestrator: SubAgentOrchestrator
  private conversation: ConversationState
  private maxTokens: number
  private compactThreshold: number
  private activeModel: string = ''

  constructor(
    provider: AIProvider,
    toolRegistry: ToolRegistry,
    projectDir: string = process.cwd(),
    maxTokens: number = 128000,
  ) {
    this.provider = provider
    this.toolRegistry = toolRegistry
    this.permissionManager = new PermissionManager(projectDir)
    this.tokenTracker = new TokenTracker(maxTokens)
    this.taskTimer = new TaskTimer()
    this.memoryManager = new MemoryManager(projectDir)
    this.errorLearner = new ErrorLearner(this.memoryManager)
    this.clarificationHandler = new ClarificationHandler()
    this.compactor = new SessionCompactor(provider, this.tokenTracker)
    this.subAgentOrchestrator = new SubAgentOrchestrator(provider, toolRegistry, projectDir)
    this.maxTokens = maxTokens
    this.compactThreshold = Math.floor(maxTokens * 0.8)
    this.conversation = {
      messages: [],
      tokenUsage: 0,
      isCompacting: false,
    }
  }

  async initialize(modelName?: string): Promise<void> {
    if (modelName) {
      this.activeModel = modelName
    }

    const memoryPrompt = await this.memoryManager.getSystemPrompt()
    const previousSummary = this.compactor.getPreviousSummary()

    let basePrompt = `${memoryPrompt}

Available tools:
${this.toolRegistry.getAll()
  .map((t) => `- ${t.name}: ${t.description}${t.requiresPermission ? ' (requires permission)' : ''}`)
  .join('\n')}

Rules:
- Use tools when appropriate to complete tasks
- Always check file contents before editing
- Show diffs before making changes
- Ask for clarification when requests are ambiguous
- Be concise and focused
- Use multiple tools in sequence when needed

When using a tool, respond with a tool call in this format:
[TOOL_CALL: tool_name]
{"arg1": "value1", "arg2": "value2"}
[END_TOOL_CALL]

After receiving tool results, continue with your response.`

    if (this.activeModel) {
      basePrompt = modelProfileManager.getAdaptedSystemPrompt(this.activeModel, basePrompt)
    }

    this.conversation.messages = [
      { role: 'system' as const, content: basePrompt },
      ...(previousSummary ? [{ role: 'assistant' as const, content: previousSummary }] : []),
    ]
  }

  setActiveModel(modelName: string): void {
    this.activeModel = modelName
    this.maxTokens = modelProfileManager.getContextWindow(modelName)
    this.tokenTracker.setContextWindow(this.maxTokens)
  }

  private getSystemMessage(): ConversationMessage {
    const tools = this.toolRegistry.getAll()
    const toolDescriptions = tools
      .map((t) => `- ${t.name}: ${t.description}${t.requiresPermission ? ' (requires permission)' : ''}`)
      .join('\n')

    return {
      role: 'system',
      content: `You are Spectre, a coding agent with tools to help developers.

Available tools:
${toolDescriptions}

Rules:
- Use tools when appropriate to complete tasks
- Always check file contents before editing
- Show diffs before making changes
- Ask for clarification when requests are ambiguous
- Be concise and focused
- Use multiple tools in sequence when needed

When using a tool, respond with a tool call in this format:
[TOOL_CALL: tool_name]
{"arg1": "value1", "arg2": "value2"}
[END_TOOL_CALL]

After receiving tool results, continue with your response.`,
    }
  }

  async processMessage(
    userInput: string,
    onStream?: StreamCallback,
    onToolCall?: ToolCallback,
    onPermissionRequest?: PermissionCallback,
    onClarification?: ClarificationCallback,
  ): Promise<string> {
    if (onClarification) {
      this.clarificationHandler.setCallback(onClarification)
    }

    this.taskTimer.reset()
    this.taskTimer.start()

    this.conversation.messages.push({ role: 'user', content: userInput })
    this.updateTokenUsage()

    if (this.compactor.shouldCompact(this.maxTokens)) {
      const result = await this.compactor.compact(
        this.conversation.messages,
        this.conversation.messages[0],
      )
      if (result) {
        this.conversation.messages = [
          this.conversation.messages[0],
          { role: 'assistant', content: `[COMPACTION SUMMARY]\n${result.summary}\n[END COMPACTION SUMMARY]` },
          ...this.conversation.messages.slice(-10),
        ]
      }
    }

    let response = ''
    const toolOutputs: string[] = []
    let hasToolCalls = true

    while (hasToolCalls) {
      const result = await this.generateResponse(onStream)
      response += result.text

      if (result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          const tool = this.toolRegistry.get(toolCall.name)
          if (!tool) {
            const matchingTool = this.toolRegistry.findMatchingTool(toolCall.name)

            if (!matchingTool) {
              logger.info(`No tool found for "${toolCall.name}", checking for gap...`)

              const gapDescription = `Create a tool to handle: ${toolCall.name} with arguments: ${JSON.stringify(toolCall.arguments)}`

              await this.memoryManager.appendDiaryEntry(
                `Tool Gap Detected: No existing tool can handle "${toolCall.name}".\nRequirement: ${gapDescription}`,
              )

              logger.info(`Spawning sub-agent to create tool for: ${toolCall.name}`)

              const toolCreator = this.toolRegistry.get('create_tool')
              if (toolCreator) {
                const toolResult = await toolCreator.execute({
                  requirement: gapDescription,
                  source: 'auto',
                })

                this.conversation.messages.push({
                  role: 'tool',
                  content: toolResult.success
                    ? `🔧 Auto-created restart-ready tool: ${toolResult.output}\n\nRestart Spectre to link this tool into the agent runtime. You can continue now and restart later.`
                    : `❌ Tool creation failed: ${toolResult.error}`,
                  tool_call_id: toolCall.id,
                  tool_name: 'create_tool',
                })

                continue
              }
            }

            this.conversation.messages.push({
              role: 'tool',
              content: `Error: Unknown tool "${toolCall.name}"`,
              tool_call_id: toolCall.id,
              tool_name: toolCall.name,
            })
            continue
          }

          if (tool.requiresPermission && onPermissionRequest) {
            const pattern = (toolCall.arguments.path as string) || (toolCall.arguments.command as string) || '*'
            const decision = await onPermissionRequest(toolCall.name, pattern)

            if (decision === 'declined') {
              this.conversation.messages.push({
                role: 'tool',
                content: 'Permission denied by user',
                tool_call_id: toolCall.id,
                tool_name: toolCall.name,
              })
              continue
            }

            if (decision === 'always') {
              this.permissionManager.grantPermission(toolCall.name, pattern, 'always')
            }
          }

          const toolResult = onToolCall
            ? await executeWithRetry(`tool:${toolCall.name}`, () =>
                onToolCall(toolCall.name, toolCall.arguments),
                { maxAttempts: 3 },
              )
            : await executeWithRetry(`tool:${toolCall.name}`, () =>
                this.toolRegistry.execute(toolCall.name, toolCall.arguments),
                { maxAttempts: 3 },
              )

          toolOutputs.push(
            toolResult.success
              ? `${toolCall.name}: ${toolResult.output}`
              : `${toolCall.name}: Error: ${toolResult.error}`,
          )

          this.conversation.messages.push({
            role: 'tool',
            content: toolResult.success ? toolResult.output : `Error: ${toolResult.error}`,
            tool_call_id: toolCall.id,
            tool_name: toolCall.name,
          })
        }

        hasToolCalls = true
      } else {
        hasToolCalls = false
      }
    }

    this.taskTimer.stop()
    this.updateTokenUsage()

    await this.memoryManager.appendDiaryEntry(`User: ${userInput.substring(0, 100)}...`)

    const finalResponse = response.trim() || this.buildEmptyResponseFallback(toolOutputs)
    const lastMessage = this.conversation.messages[this.conversation.messages.length - 1]
    if (lastMessage?.role === 'assistant' && !lastMessage.content.trim()) {
      lastMessage.content = finalResponse
    }

    return finalResponse
  }

  async *processStream(
    userInput: string,
    _onToolCall?: ToolCallback,
    _onPermissionRequest?: PermissionCallback,
  ): AsyncIterable<string> {
    this.taskTimer.reset()
    this.taskTimer.start()

    this.conversation.messages.push({ role: 'user', content: userInput })
    this.updateTokenUsage()

    if (this.compactor.shouldCompact(this.maxTokens)) {
      const result = await this.compactor.compact(
        this.conversation.messages,
        this.conversation.messages[0],
      )
      if (result) {
        this.conversation.messages = [
          this.conversation.messages[0],
          { role: 'assistant', content: `[COMPACTION SUMMARY]\n${result.summary}\n[END COMPACTION SUMMARY]` },
          ...this.conversation.messages.slice(-10),
        ]
      }
    }

    const prompt = this.buildPrompt()
    yield* this.provider.generateCompletionStream(prompt)

    this.taskTimer.stop()
  }

  private async generateResponse(_onStream?: StreamCallback): Promise<{ text: string; toolCalls: ToolCall[] }> {
    const prompt = this.buildPrompt()

    try {
      const response = await this.provider.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: this.activeModel
          ? modelProfileManager.getMaxResponseLength(this.activeModel)
          : 4096,
      })

      const toolCalls = this.parseToolCalls(response)
      const text = this.stripToolCalls(response)

      if (toolCalls.length > 0) {
        this.conversation.messages.push({
          role: 'assistant',
          content: text,
          tool_calls: toolCalls,
        })
      } else {
        this.conversation.messages.push({
          role: 'assistant',
          content: text,
        })
      }

      return { text, toolCalls }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.warn(`Model error: ${errorMessage}`)

      if (this.activeModel) {
        markModelUnavailable(this.provider.name, this.activeModel, errorMessage)
      }

      const recovery = await this.errorLearner.handleError(errorMessage)
      await this.memoryManager.appendDiaryEntry(`Model Error: ${errorMessage.substring(0, 200)}\nRecovery: ${recovery.recovery.substring(0, 200)}`)

      return {
        text: `I encountered an error: ${errorMessage.substring(0, 100)}...\n\n${recovery.recovery}`,
        toolCalls: [],
      }
    }
  }

  private buildPrompt(): string {
    return this.conversation.messages
      .map((msg) => {
        if (msg.role === 'system') return msg.content
        if (msg.role === 'tool') {
          return `[TOOL_RESULT: ${msg.tool_name || 'unknown'}]\n${msg.content}\n[END_TOOL_RESULT]`
        }
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          const toolCallsStr = msg.tool_calls
            .map((tc) => `[TOOL_CALL: ${tc.name}]\n${JSON.stringify(tc.arguments)}\n[END_TOOL_CALL]`)
            .join('\n')
          return `${msg.content}\n${toolCallsStr}`
        }
        return `${msg.role}: ${msg.content}`
      })
      .join('\n\n')
  }

  private parseToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = []
    const regex = /\[TOOL_CALL:\s*(\w+)\]\s*\n([\s\S]*?)\n\[END_TOOL_CALL\]/g
    let match

    while ((match = regex.exec(response)) !== null) {
      try {
        const args = JSON.parse(match[2]) as ToolInput
        toolCalls.push({
          id: `tc-${Date.now()}-${toolCalls.length}`,
          name: match[1],
          arguments: args,
        })
      } catch {
        logger.warn(`Failed to parse tool call arguments: ${match[2]}`)
      }
    }

    return toolCalls
  }

  private stripToolCalls(response: string): string {
    return response
      .replace(/\[TOOL_CALL:\s*\w+\]\s*\n[\s\S]*?\n\[END_TOOL_CALL\]/g, '')
      .trim()
  }

  private buildEmptyResponseFallback(toolOutputs: string[]): string {
    if (toolOutputs.length === 0) {
      return 'I did not receive a text response from the model. Please try again or switch models with /model.'
    }

    const summary = toolOutputs
      .slice(-3)
      .map((output) => output.length > 800 ? `${output.slice(0, 800)}...` : output)
      .join('\n\n')

    return `I completed the tool work, but the model did not return a final text response. Latest tool results:\n\n${summary}`
  }

  private updateTokenUsage(): void {
    const totalText = this.conversation.messages.map((m) => m.content).join('')
    const estimated = TokenTracker.estimateTokens(totalText)
    this.tokenTracker.addUsage({ totalTokens: estimated })
    this.conversation.tokenUsage = estimated
  }

  async compactConversation(): Promise<void> {
    const result = await this.compactor.compact(
      this.conversation.messages,
      this.conversation.messages[0],
    )
    if (result) {
      this.conversation.messages = [
        this.conversation.messages[0],
        { role: 'assistant', content: `[COMPACTION SUMMARY]\n${result.summary}\n[END COMPACTION SUMMARY]` },
        ...this.conversation.messages.slice(-10),
      ]
      this.updateTokenUsage()
    }
  }

  async spawnSubAgents(
    tasks: { id: string; description: string }[],
    onStatus?: SubAgentStatusCallback,
  ) {
    return this.subAgentOrchestrator.spawnTasks(tasks, onStatus)
  }

  getTaskTimer(): TaskTimer {
    return this.taskTimer
  }

  getMemoryManager(): MemoryManager {
    return this.memoryManager
  }

  getErrorLearner(): ErrorLearner {
    return this.errorLearner
  }

  getClarificationHandler(): ClarificationHandler {
    return this.clarificationHandler
  }

  getActiveModel(): string {
    return this.activeModel
  }

  getConversationState(): ConversationState {
    return { ...this.conversation }
  }

  getTokenStats() {
    return this.tokenTracker.getState()
  }

  async resetConversation(): Promise<void> {
    this.taskTimer.reset()
    this.tokenTracker.reset()
    this.conversation = {
      messages: [],
      tokenUsage: 0,
      isCompacting: false,
    }
    await this.initialize()
  }
}

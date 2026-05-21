import {
  debtCommand,
  docsCommand,
  indexCommand,
  queryCommand,
  reviewCommand,
} from '../commands/tools.js'

export type AgentToolName = 'index' | 'query' | 'review' | 'debt' | 'docs'

const TOOL_COMMANDS = {
  index: indexCommand,
  query: queryCommand,
  review: reviewCommand,
  debt: debtCommand,
  docs: docsCommand,
} as const

export async function runAgentTool(tool: string, args: string): Promise<string> {
  const normalized = tool.trim().toLowerCase() as AgentToolName
  const command = TOOL_COMMANDS[normalized]
  if (!command) {
    throw new Error(
      `Unknown agent tool: ${tool}. Available tools: ${Object.keys(TOOL_COMMANDS).join(', ')}, clarify`,
    )
  }

  const result = await command.execute(args || '')
  if (!result || result.trim().length === 0) {
    return `${normalized} completed with no output.`
  }
  return result
}

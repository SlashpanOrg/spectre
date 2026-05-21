import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const queryCodebaseTool: ToolDefinition = {
  name: 'query_codebase',
  description: 'Ask questions about the indexed codebase using semantic search',
  parameters: {
    question: { type: 'string', description: 'Question to ask about the codebase', required: true },
    limit: { type: 'number', description: 'Maximum number of results (default: 10)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const question = input.question as string
    if (!question) {
      return { success: false, output: '', error: 'Question is required' }
    }

    try {
      const { QueryEngine } = await import('../../tools/query-engine.js')
      const engine = new QueryEngine()
      const result = await engine.query(question, (input.limit as number) || 10)

      let output = `🔍 Query: "${question}"\n${'─'.repeat(60)}\n\n`
      output += `💡 Answer:\n${result.answer}\n\n`

      if (result.evidence.length > 0) {
        output += `📋 Evidence (${result.evidence.length} sources):\n`
        for (const ev of result.evidence.slice(0, 5)) {
          output += `\n  • ${ev.message.substring(0, 100)}...\n`
          output += `    Score: ${(ev.score * 100).toFixed(1)}% | ${ev.author} | ${ev.date}\n`
        }
      }

      output += `\n⏱️  Duration: ${result.duration}ms`

      return { success: true, output }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Query failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}

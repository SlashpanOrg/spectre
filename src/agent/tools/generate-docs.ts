import { ToolDefinition, ToolInput, ToolResult } from './types.js'
import { getProvider } from '../../ai/config.js'

export const generateDocsTool: ToolDefinition = {
  name: 'generate_docs',
  description: 'Generate documentation for the codebase',
  parameters: {
    type: { type: 'string', description: 'Documentation type: runbook, onboarding, decision-log, architecture', required: true },
    path: { type: 'string', description: 'Path to document (default: current directory)', required: false },
    output: { type: 'string', description: 'Output file path (optional, prints to stdout if not specified)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const docType = input.type as string
    if (!docType) {
      return { success: false, output: '', error: 'Documentation type is required (runbook, onboarding, decision-log, architecture)' }
    }

    const validTypes = ['runbook', 'onboarding', 'decision-log', 'architecture']
    if (!validTypes.includes(docType)) {
      return { success: false, output: '', error: `Invalid type: ${docType}. Must be one of: ${validTypes.join(', ')}` }
    }

    try {
      const { DocGenerator } = await import('../../tools/doc-generator.js')
      const docPath = (input.path as string) || '.'
      const outputFile = input.output as string | undefined
      const provider = getProvider()

      const generator = new DocGenerator(docPath, provider)
      const result = await generator.generate(docType as 'runbook' | 'onboarding' | 'decision-log' | 'architecture')

      let output = `📄 Generated ${docType} documentation\n${'─'.repeat(60)}\n\n`
      output += result.content

      if (outputFile) {
        const { resolve } = await import('path')
        await generator.export(result, resolve(process.cwd(), outputFile))
        output += `\n\n✅ Written to: ${outputFile}`
      }

      output += `\n\n⏱️  Duration: ${result.duration}ms | 📝 ${result.wordCount} words`

      return { success: true, output }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Documentation generation failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}

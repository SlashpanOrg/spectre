import { DocGenerator, DocType } from '../tools/doc-generator.js'
import { getProvider, clearProviderCache } from '../ai/config.js'
import { logger } from '../utils/logger.js'

const VALID_TYPES: DocType[] = ['runbook', 'onboarding', 'decision-log', 'architecture']

export const docsCommand = {
  name: 'docs',
  description: 'Generate documentation (runbook, onboarding, decision-log, architecture)',
  usage: '/docs <type> [--export <path>]',
  execute: async (args?: string): Promise<string> => {
    try {
      clearProviderCache()
      const provider = getProvider()

      if (!args) {
        return `Available doc types:\n${VALID_TYPES.map((t) => `- ${t}`).join('\n')}\n\nUsage: /docs <type> [--export <path>]`
      }

      const parts = args.split(' ')
      const type = parts[0] as DocType

      if (!VALID_TYPES.includes(type)) {
        return `Invalid doc type: ${type}\nAvailable: ${VALID_TYPES.join(', ')}`
      }

      const exportPath = parts.includes('--export')
        ? parts[parts.indexOf('--export') + 1]
        : undefined

      const generator = new DocGenerator('.', provider)
      const doc = await generator.generate(type)

      let output = `📄 ${doc.title}\n`
      output += `Type: ${doc.type}\n`
      output += `Words: ${doc.wordCount}\n`
      output += `Generated: ${doc.generatedAt}\n`
      output += `Duration: ${doc.duration}ms\n\n`
      output += '---\n\n'
      output += doc.content

      if (exportPath) {
        await generator.export(doc, exportPath)
        output += `\n\nExported to: ${exportPath}`
      }

      return output
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      logger.error('Doc generation failed:', msg)
      return `Doc generation failed: ${msg}`
    }
  },
}

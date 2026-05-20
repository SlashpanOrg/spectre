export interface CommandHandler {
  name: string
  description: string
  execute: (args: string) => Promise<string>
}

export interface ParsedCommand {
  name: string
  args: string
  isCommand: boolean
}

export class CommandParser {
  private commands: Map<string, CommandHandler> = new Map()

  register(handler: CommandHandler): void {
    this.commands.set(handler.name.toLowerCase(), handler)
  }

  parse(input: string): ParsedCommand {
    const trimmed = input.trim()
    if (!trimmed.startsWith('/')) {
      return { name: '', args: trimmed, isCommand: false }
    }

    const parts = trimmed.substring(1).split(/\s+/)
    const name = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    return { name, args, isCommand: true }
  }

  async execute(input: string): Promise<string | null> {
    const parsed = this.parse(input)
    if (!parsed.isCommand) return null

    const handler = this.commands.get(parsed.name)
    if (!handler) {
      const suggestions = this.getSuggestions(parsed.name)
      if (suggestions.length > 0) {
        return `Unknown command: /${parsed.name}. Did you mean: ${suggestions.map((s) => `/${s}`).join(', ')}?`
      }
      return `Unknown command: /${parsed.name}. Type /help for available commands.`
    }

    try {
      return await handler.execute(parsed.args)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return `Error executing /${parsed.name}: ${message}`
    }
  }

  getHelp(): string {
    const lines = ['Available commands:']
    for (const [name, handler] of this.commands) {
      lines.push(`  /${name.padEnd(12)} ${handler.description}`)
    }
    return lines.join('\n')
  }

  private getSuggestions(name: string): string[] {
    const allNames = Array.from(this.commands.keys())
    return allNames.filter((n) => n.startsWith(name) || this.levenshtein(n, name) <= 2)
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          )
        }
      }
    }
    return matrix[b.length][a.length]
  }
}

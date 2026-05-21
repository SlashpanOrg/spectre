import { execa } from 'execa'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const runCommandTool: ToolDefinition = {
  name: 'run_command',
  description: 'Execute a shell command in the current working directory',
  parameters: {
    command: { type: 'string', description: 'Command to execute', required: true },
    args: { type: 'string', description: 'Command arguments (space-separated)', required: false },
    timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)', required: false },
  },
  requiresPermission: true,
  permissionPattern: 'run_command',
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const command = input.command as string
    if (!command) {
      return { success: false, output: '', error: 'Command is required' }
    }

    const argsStr = (input.args as string) || ''
    const args = argsStr.trim() ? argsStr.split(/\s+/) : []
    const timeout = (input.timeout as number) || 30000

    try {
      const result = await execa(command, args, {
        cwd: process.cwd(),
        timeout,
        maxBuffer: 10 * 1024 * 1024,
      })

      let output = `✅ Command: ${command} ${args.join(' ')}\n${'─'.repeat(60)}`
      if (result.stdout) {
        output += `\n${result.stdout}`
      }
      if (result.stderr) {
        output += `\n\n⚠️  Stderr:\n${result.stderr}`
      }
      output += `\n\nExit code: ${result.exitCode}`

      return { success: result.exitCode === 0, output }
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; exitCode?: number; message?: string }
      let output = `❌ Command: ${command} ${args.join(' ')}\n${'─'.repeat(60)}`
      if (execError.stdout) {
        output += `\n${execError.stdout}`
      }
      if (execError.stderr) {
        output += `\n\n⚠️  Stderr:\n${execError.stderr}`
      }
      output += `\n\nExit code: ${execError.exitCode ?? -1}`

      return {
        success: false,
        output,
        error: execError.message || 'Command execution failed',
      }
    }
  },
}

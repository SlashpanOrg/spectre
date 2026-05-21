import { execa } from 'execa'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const debugCodeTool: ToolDefinition = {
  name: 'debug_code',
  description: 'Run code with verbose output to help identify issues',
  parameters: {
    file: { type: 'string', description: 'File to debug', required: true },
    runtime: { type: 'string', description: 'Runtime to use: node, python, etc. (default: node)', required: false },
    args: { type: 'string', description: 'Additional arguments', required: false },
  },
  requiresPermission: true,
  permissionPattern: 'run_command',
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const file = input.file as string
    if (!file) {
      return { success: false, output: '', error: 'File path is required' }
    }

    const runtime = (input.runtime as string) || 'node'
    const argsStr = (input.args as string) || ''
    const args = argsStr.trim() ? argsStr.split(/\s+/) : []

    const resolvedPath = resolve(process.cwd(), file)
    if (!existsSync(resolvedPath)) {
      return { success: false, output: '', error: `File not found: ${file}` }
    }

    try {
      const result = await execa(runtime, [resolvedPath, ...args], {
        cwd: process.cwd(),
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_ENV: 'development', DEBUG: '*' },
      })

      let output = `🔍 Debug: ${runtime} ${file}\n${'─'.repeat(60)}`
      if (result.stdout) {
        output += `\n${result.stdout}`
      }
      if (result.stderr) {
        output += `\n\n📋 Stderr:\n${result.stderr}`
      }

      return { success: result.exitCode === 0, output }
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string }
      let output = `❌ Debug failed: ${runtime} ${file}\n${'─'.repeat(60)}`
      if (execError.stdout) {
        output += `\n${execError.stdout}`
      }
      if (execError.stderr) {
        output += `\n\n📋 Stderr:\n${execError.stderr}`
      }

      return {
        success: false,
        output,
        error: execError.message || 'Debug execution failed',
      }
    }
  },
}

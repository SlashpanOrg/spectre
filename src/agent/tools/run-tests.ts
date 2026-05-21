import { execa } from 'execa'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { ToolDefinition, ToolInput, ToolResult } from './types.js'

export const runTestsTool: ToolDefinition = {
  name: 'run_tests',
  description: 'Execute test suites and report results',
  parameters: {
    path: { type: 'string', description: 'Test file or directory path (default: run all tests)', required: false },
    pattern: { type: 'string', description: 'Test name pattern to filter', required: false },
    watch: { type: 'boolean', description: 'Run in watch mode (default: false)', required: false },
  },
  requiresPermission: true,
  permissionPattern: 'run_command',
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const testPath = input.path as string
    const pattern = input.pattern as string
    const watch = input.watch === true

    const cwd = process.cwd()
    const packageJsonPath = resolve(cwd, 'package.json')

    if (!existsSync(packageJsonPath)) {
      return { success: false, output: '', error: 'No package.json found in current directory' }
    }

    const command = 'npm'
    const args = ['test']

    if (watch) {
      args.push('--', '--watch')
    }
    if (testPath) {
      args.push('--', testPath)
    }
    if (pattern) {
      args.push('--', '--testNamePattern', pattern)
    }

    try {
      const result = await execa(command, args, {
        cwd,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      })

      let output = `✅ Tests completed\n${'─'.repeat(60)}`
      if (result.stdout) {
        output += `\n${result.stdout}`
      }

      return { success: result.exitCode === 0, output }
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string }
      let output = `❌ Tests failed\n${'─'.repeat(60)}`
      if (execError.stdout) {
        output += `\n${execError.stdout}`
      }
      if (execError.stderr) {
        output += `\n\n⚠️  Stderr:\n${execError.stderr}`
      }

      return {
        success: false,
        output,
        error: execError.message || 'Test execution failed',
      }
    }
  },
}

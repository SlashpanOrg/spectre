import { describe, it, expect, beforeEach } from 'vitest'
import { CommandParser, CommandHandler } from '../../src/commands/parser.js'

describe('CommandParser', () => {
  let parser: CommandParser

  beforeEach(() => {
    parser = new CommandParser()
  })

  it('should parse non-command input', () => {
    const result = parser.parse('hello world')
    expect(result.isCommand).toBe(false)
    expect(result.name).toBe('')
    expect(result.args).toBe('hello world')
  })

  it('should parse command without args', () => {
    const result = parser.parse('/help')
    expect(result.isCommand).toBe(true)
    expect(result.name).toBe('help')
    expect(result.args).toBe('')
  })

  it('should parse command with args', () => {
    const result = parser.parse('/query why did we choose X')
    expect(result.isCommand).toBe(true)
    expect(result.name).toBe('query')
    expect(result.args).toBe('why did we choose X')
  })

  it('should execute registered command', async () => {
    const handler: CommandHandler = {
      name: 'test',
      description: 'Test command',
      execute: async () => 'test result',
    }
    parser.register(handler)

    const result = await parser.execute('/test')
    expect(result).toBe('test result')
  })

  it('should return null for non-command input', async () => {
    const result = await parser.execute('hello world')
    expect(result).toBe(null)
  })

  it('should handle unknown command with suggestion', async () => {
    const handler: CommandHandler = {
      name: 'help',
      description: 'Show help',
      execute: async () => 'help',
    }
    parser.register(handler)

    const result = await parser.execute('/halp')
    expect(result).toContain('Unknown command')
    expect(result).toContain('/help')
  })

  it('should handle command execution error', async () => {
    const handler: CommandHandler = {
      name: 'fail',
      description: 'Failing command',
      execute: async () => {
        throw new Error('test error')
      },
    }
    parser.register(handler)

    const result = await parser.execute('/fail')
    expect(result).toContain('Error executing /fail')
    expect(result).toContain('test error')
  })

  it('should generate help text', async () => {
    const handler: CommandHandler = {
      name: 'test',
      description: 'Test command',
      execute: async () => 'test',
    }
    parser.register(handler)

    const help = parser.getHelp()
    expect(help).toContain('/test')
    expect(help).toContain('Test command')
  })
})

#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import { CommandParser } from './commands/parser.js'
import { helpCommand } from './commands/help.js'
import { aboutCommand } from './commands/about.js'
import { quitCommand, exitCommand } from './commands/quit.js'
import { statusCommand } from './commands/status.js'
import { setupCommand } from './commands/setup.js'
import { modelCommand } from './commands/model.js'
import {
  indexCommand,
  queryCommand,
  reviewCommand,
  debtCommand,
  docsCommand,
} from './commands/tools.js'
import { agentCommand } from './commands/agent.js'
import { newSessionCommand, resumeSessionCommand, sessionsCommand } from './commands/sessions.js'
import { historyCommand, providersCommand, reposCommand } from './commands/info.js'
import { SpectreApp } from './tui/app.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

function showVersion(): void {
  console.log(`spectre v${pkg.version}`)
  console.log(`Built by Slashpan Technologies Private Limited`)
  console.log(`https://github.com/SlashpanOrg/spectre`)
}

function showHelp(): void {
  console.log(`
Spectre v${pkg.version} - AI Development Intelligence Agent

Usage:
  spectre              Launch interactive TUI session
  spectre --version    Show version information
  spectre --help       Show this help message

Commands (inside session):
  /setup               Configure AI providers and API keys
  /model               Switch AI model
  /index               Index a Git repository
  /query <question>    Ask about your codebase
  /review [base]       Review current branch changes
  /debt [branch]       Analyze technical debt
  /docs <type>         Generate documentation
  /agent <task>        Run multi-step agent task
  /help                List all commands
  /quit                Exit session

Keyboard Shortcuts:
  Ctrl+K               Command palette
  Ctrl+G               Toggle side panel
  Ctrl+C               Cancel streaming
  Ctrl+Q               Quit

Built by Slashpan Technologies Private Limited
https://github.com/SlashpanOrg/spectre
`)
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.includes('--version') || args.includes('-v')) {
    showVersion()
    process.exit(0)
  }

  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  process.stdout.write('\x1Bc')

  const parser = new CommandParser()

  parser.register(helpCommand)
  parser.register(aboutCommand)
  parser.register(quitCommand)
  parser.register(exitCommand)
  parser.register(statusCommand)
  parser.register(setupCommand)
  parser.register(modelCommand)
  parser.register(indexCommand)
  parser.register(queryCommand)
  parser.register(reviewCommand)
  parser.register(debtCommand)
  parser.register(docsCommand)
  parser.register(agentCommand)
  parser.register(sessionsCommand)
  parser.register(newSessionCommand)
  parser.register(resumeSessionCommand)
  parser.register(providersCommand)
  parser.register(historyCommand)
  parser.register(reposCommand)

  render(<SpectreApp parser={parser} />)
}

main()

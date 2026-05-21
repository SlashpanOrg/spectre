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
import { SpectreApp } from './tui/app.js'

function main(): void {
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

  render(<SpectreApp parser={parser} />)
}

main()

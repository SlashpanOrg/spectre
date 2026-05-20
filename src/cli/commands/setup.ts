import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { SetupWizard } from '../tui/setup-wizard.js'

export function setupCommand(program: Command): void {
  program
    .command('setup')
    .description('Configure API keys and AI providers')
    .action(() => {
      render(React.createElement(SetupWizard))
    })
}

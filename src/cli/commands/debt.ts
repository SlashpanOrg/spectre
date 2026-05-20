import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { DebtPanel } from '../tui/debt-panel.js'

export function debtCommand(program: Command): void {
  program
    .command('debt')
    .description('Analyze technical debt in your codebase')
    .option('-r, --repo <path>', 'Path to Git repository', '.')
    .action(async (opts) => {
      render(React.createElement(DebtPanel, { repoPath: opts.repo }))
    })
}

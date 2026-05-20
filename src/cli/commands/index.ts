import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { IndexPanel } from '../tui/index-panel.js'

export function indexCommand(program: Command): void {
  program
    .command('index')
    .description('Index a Git repository')
    .argument('[repo]', 'Path to Git repository', '.')
    .option('-f, --full', 'Force full re-index')
    .action(async (repo, opts) => {
      render(React.createElement(IndexPanel, { repoPath: repo, forceFull: opts.full }))
    })
}

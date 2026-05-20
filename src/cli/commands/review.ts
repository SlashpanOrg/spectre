import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { ReviewPanel } from '../tui/review-panel.js'

export function reviewCommand(program: Command): void {
  program
    .command('review')
    .description('Review a pull request with AI')
    .option('-r, --repo <path>', 'Path to Git repository', '.')
    .option('-b, --base <branch>', 'Base branch to compare against', 'main')
    .action(async (opts) => {
      render(React.createElement(ReviewPanel, { repoPath: opts.repo, baseBranch: opts.base }))
    })
}

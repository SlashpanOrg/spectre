import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { QueryPanel } from '../tui/query-panel.js'

export function queryCommand(program: Command): void {
  program
    .command('query')
    .description('Ask a question about your codebase')
    .argument('[question]', 'Your question')
    .action(async (question) => {
      if (question) {
        render(React.createElement(QueryPanel, { initialQuery: question }))
      } else {
        render(React.createElement(QueryPanel))
      }
    })
}

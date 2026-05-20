import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { DocsPanel } from '../tui/docs-panel.js'
import { DocType } from '../../core/doc-generator.js'

export function docsCommand(program: Command): void {
  program
    .command('docs')
    .description('Generate documentation from your codebase')
    .option('-r, --repo <path>', 'Path to Git repository', '.')
    .option('-t, --type <type>', 'Doc type (runbook, onboarding, decisions)', 'runbook')
    .action(async (opts) => {
      const docType = opts.type as DocType
      render(React.createElement(DocsPanel, { repoPath: opts.repo, docType }))
    })
}

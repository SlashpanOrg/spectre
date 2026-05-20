import { Command } from 'commander'
import { render } from 'ink'
import React from 'react'
import { IntroScreen } from '../tui/intro.js'

export function initCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Spectre in the current directory')
    .option('-d, --dir <path>', 'Directory to initialize', '.')
    .action(async (opts) => {
      render(React.createElement(IntroScreen, { directory: opts.dir }))
    })
}

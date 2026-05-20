import { Command } from 'commander'

export function queryCommand(program: Command): void {
  program
    .command('query')
    .description('Ask a question about your codebase')
    .argument('<question>', 'Your question')
    .action(async (_question) => {
      console.log('Querying knowledge graph... (coming soon)')
    })
}

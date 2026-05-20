import { Command } from 'commander'

export function indexCommand(program: Command): void {
  program
    .command('index')
    .description('Index a Git repository')
    .argument('[repo]', 'Path to Git repository', '.')
    .option('-f, --full', 'Force full re-index')
    .action(async (_repo, _opts) => {
      console.log('Indexing repository... (coming soon)')
    })
}

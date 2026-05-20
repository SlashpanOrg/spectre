import { Command } from 'commander'

export function reviewCommand(program: Command): void {
  program
    .command('review')
    .description('Review a pull request with AI')
    .option('-r, --repo <path>', 'Path to Git repository', '.')
    .option('-p, --pr <number>', 'Pull request number')
    .action(async (_opts) => {
      console.log('Analyzing pull request... (coming soon)')
    })
}

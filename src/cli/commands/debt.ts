import { Command } from 'commander'

export function debtCommand(program: Command): void {
  program
    .command('debt')
    .description('Analyze technical debt in your codebase')
    .option('-r, --repo <path>', 'Path to Git repository', '.')
    .option('--export <format>', 'Export format (markdown, json)', 'markdown')
    .action(async (_opts) => {
      console.log('Scanning for tech debt... (coming soon)')
    })
}

import { Command } from 'commander'

export function docsCommand(program: Command): void {
  program
    .command('docs')
    .description('Generate documentation from your codebase')
    .option('-r, --repo <path>', 'Path to Git repository', '.')
    .option('-t, --type <type>', 'Doc type (runbook, onboarding, decisions)', 'runbook')
    .option('--export <format>', 'Export format (markdown, pdf)', 'markdown')
    .action(async (_opts) => {
      console.log('Generating documentation... (coming soon)')
    })
}

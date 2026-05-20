import { Command } from 'commander'
import { getWelcomeBanner, getVersionInfo } from '../utils/branding.js'
import { initCommand } from './commands/init.js'
import { setupCommand } from './commands/setup.js'
import { indexCommand } from './commands/index.js'
import { queryCommand } from './commands/query.js'
import { reviewCommand } from './commands/review.js'
import { debtCommand } from './commands/debt.js'
import { docsCommand } from './commands/docs.js'

const VERSION = '0.1.0'

const program = new Command()

program
  .name('spectre')
  .description("AI Development Intelligence Agent — Your codebase's institutional memory")
  .version(VERSION, '-v, --version')
  .addHelpText('before', getWelcomeBanner())

initCommand(program)
setupCommand(program)
indexCommand(program)
queryCommand(program)
reviewCommand(program)
debtCommand(program)
docsCommand(program)

program
  .command('about')
  .description('Show information about Spectre')
  .action(() => {
    console.log(getVersionInfo(VERSION))
  })

export { program }

export const ASCII_ART = `
           ╭──────────────────────────────╮
           │          .-""""""-.          │
           │        .'  .--.  '.          │
           │       /   (o  o)   \\         │
           │      |     \\__/     |        │
           │       \\   .----.   /         │
           │        '. '----' .'          │
           │     _.-'  |    |  '-._       │
           │   .'   _.-'    '-._   '.     │
           │  /   .'          '.   \\      │
           │ |   /   SPECTRE    \\   |     │
           │  \\  \\              /  /      │
           │   '. '.          .' .'       │
           │     '-._'.____.'_.-'         │
           ╰──────────────────────────────╯`

export const TOOL_NAME = 'SPECTRE'
export const TAGLINE = 'AI Development Intelligence Agent'
export const BUILT_BY = 'Built by Slashpan Technologies Private Limited'
export const CONTACT_EMAIL = 'sp@slashpan.com'
export const GITHUB_URL = 'https://github.com/SlashpanOrg/spectre'

export const WELCOME_MESSAGE = `${ASCII_ART}

           ${TAGLINE}
           ${'─'.repeat(TAGLINE.length)}
           ${BUILT_BY}
           ${CONTACT_EMAIL}  |  ${GITHUB_URL}
`

export const HELP_MESSAGE = `Available commands:
  /help          Show this help message
  /setup         Configure API keys and AI providers
  /model         View or switch AI model
  /index         Index a Git repository
  /query         Ask a question about your codebase
  /review        Review a pull request
  /debt          Analyze technical debt
  /docs          Generate documentation
  /status        Show session status
  /about         Show information about Spectre
  /quit          Exit the session

Keyboard shortcuts:
  Ctrl+C         Interrupt current operation
  Ctrl+D         Exit session
  Up/Down        Navigate command history
  Tab            Autocomplete commands
`

export const VERSION = '0.1.0'

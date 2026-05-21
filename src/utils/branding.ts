export const ASCII_ART = `
███████╗██████╗ ███████╗ ██████╗████████╗██████╗ ███████╗
██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔════╝
███████╗██████╔╝█████╗  ██║        ██║   ██████╔╝█████╗  
╚════██║██╔═══╝ ██╔══╝  ██║        ██║   ██╔══██╗██╔══╝  
███████║██║     ███████╗╚██████╗   ██║   ██║  ██║███████╗
╚══════╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
`

export const TOOL_NAME = 'SPECTRE'
export const TAGLINE = 'AI Development Intelligence Agent'
export const BUILT_BY = 'Built by Slashpan Technologies Private Limited'
export const CONTACT_EMAIL = 'sp@slashpan.com'
export const GITHUB_URL = 'https://github.com/SlashpanOrg/spectre'

export const VERSION = '0.3.0'

export const WELCOME_MESSAGE = `${ASCII_ART}
v${VERSION}
${TAGLINE}
${'─'.repeat(TAGLINE.length)}
${BUILT_BY}
${CONTACT_EMAIL}  |  ${GITHUB_URL}
`

export const HELP_MESSAGE = `Spectre commands:

Setup
  /setup              Configure a provider, API key, and initial model
  /status             Show active provider, model, and indexing status

Models
  /model              Open the interactive model switcher
  /model <name>       Switch directly to a model name

Agent
  /agent <task>       Assign a multi-step task to Spectre and track progress
  Example: /agent index this repo and summarize technical debt

Codebase
  /index              Index a Git repository
  /query <question>   Ask a question about your codebase
  /review [base]      Review branch changes
  /debt [branch]      Analyze technical debt
  /docs <type>        Generate runbooks, onboarding guides, ADRs, or architecture docs

Session
  /new [title]        Start a fresh saved chat session
  /sessions          List saved chat sessions
  /resume <id>       Show recent messages from a saved session
  /help               Show this help message
  /about              Show information about Spectre
  /quit               Exit the session

Keyboard shortcuts:
  Ctrl+C              Interrupt current operation when possible
  Ctrl+Q / Ctrl+D     Exit session
  ↑/↓                 Navigate interactive lists
  Tab or /            Filter setup/model lists
  Esc                 Cancel active setup/model flow
`

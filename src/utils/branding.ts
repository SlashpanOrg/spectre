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

export function getWelcomeBanner(): string {
  return `${ASCII_ART}

           ${TAGLINE}
           ${'─'.repeat(TAGLINE.length)}
           ${BUILT_BY}
           ${CONTACT_EMAIL}  |  ${GITHUB_URL}
`
}

export function getVersionInfo(version: string): string {
  return `${TOOL_NAME} v${version}\n${BUILT_BY}\n${CONTACT_EMAIL}`
}

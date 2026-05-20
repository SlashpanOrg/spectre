import { CommandHandler } from './parser.js'
import { VERSION, TOOL_NAME, BUILT_BY, CONTACT_EMAIL, GITHUB_URL } from '../utils/branding.js'

export const aboutCommand: CommandHandler = {
  name: 'about',
  description: 'Show information about Spectre',
  execute: async () =>
    `${TOOL_NAME} v${VERSION}\n${BUILT_BY}\nContact: ${CONTACT_EMAIL}\nRepository: ${GITHUB_URL}`,
}

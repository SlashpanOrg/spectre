import { CommandHandler } from './parser.js'
import { createSession, SessionStore } from '../session/session-store.js'

function formatSession(session: ReturnType<SessionStore['list']>[number]): string {
  return `${session.id}  ${session.title}  (${session.messages.length} messages, updated ${session.updatedAt})`
}

export const sessionsCommand: CommandHandler = {
  name: 'sessions',
  description: 'List saved chat sessions',
  execute: async () => {
    const store = new SessionStore()
    const sessions = store.list()
    if (sessions.length === 0) {
      return 'No saved sessions yet. Start chatting, or run /new to create one.'
    }
    return [
      'Saved sessions:',
      ...sessions.slice(0, 20).map((session) => `  ${formatSession(session)}`),
    ].join('\n')
  },
}

export const newSessionCommand: CommandHandler = {
  name: 'new',
  description: 'Start a new chat session',
  execute: async (args?: string) => {
    const store = new SessionStore()
    const session = createSession(args?.trim() || 'New Spectre session')
    store.save(session)
    return `Started ${session.id}: ${session.title}`
  },
}

export const resumeSessionCommand: CommandHandler = {
  name: 'resume',
  description: 'Show messages from a saved session',
  execute: async (args?: string) => {
    const id = args?.trim()
    if (!id) return 'Usage: /resume <session-id>'

    const store = new SessionStore()
    const session = store.read(id)
    if (!session) return `Session not found: ${id}`

    const messages = session.messages.slice(-12).map((message) => {
      const role = message.role.padEnd(9)
      return `${role} ${message.content}`
    })

    return [
      `Session ${session.id}: ${session.title}`,
      `Updated: ${session.updatedAt}`,
      '',
      ...messages,
    ].join('\n')
  },
}

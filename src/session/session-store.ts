import fs from 'node:fs'
import path from 'node:path'
import { getConfigDir } from '../utils/config.js'

export interface SessionRecord {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool' | 'error'
    content: string
    timestamp: string
  }>
}

export function getSessionsDir(): string {
  return path.join(getConfigDir(), 'sessions')
}

export function createSession(title: string = 'New session'): SessionRecord {
  const now = new Date().toISOString()
  return {
    id: `session-${Date.now()}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

export class SessionStore {
  private sessionsDir: string

  constructor(sessionsDir: string = getSessionsDir()) {
    this.sessionsDir = sessionsDir
    this.ensureDir()
  }

  list(): SessionRecord[] {
    this.ensureDir()
    return fs
      .readdirSync(this.sessionsDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => this.read(path.basename(file, '.json')))
      .filter((session): session is SessionRecord => Boolean(session))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  read(id: string): SessionRecord | undefined {
    const file = this.pathFor(id)
    if (!fs.existsSync(file)) return undefined
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as SessionRecord
    return raw
  }

  save(session: SessionRecord): void {
    this.ensureDir()
    const tempFile = `${this.pathFor(session.id)}.tmp-${process.pid}`
    fs.writeFileSync(tempFile, JSON.stringify(session, null, 2), { encoding: 'utf-8', mode: 0o600 })
    fs.renameSync(tempFile, this.pathFor(session.id))
    fs.chmodSync(this.pathFor(session.id), 0o600)
  }

  appendMessage(
    id: string,
    role: SessionRecord['messages'][number]['role'],
    content: string,
  ): SessionRecord {
    const session = this.read(id) || createSession()
    session.messages.push({ role, content, timestamp: new Date().toISOString() })
    session.updatedAt = new Date().toISOString()
    this.save(session)
    return session
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true, mode: 0o700 })
    } else {
      fs.chmodSync(this.sessionsDir, 0o700)
    }
  }

  private pathFor(id: string): string {
    const safeId = id.replace(/[^a-zA-Z0-9._-]/g, '_')
    return path.join(this.sessionsDir, `${safeId}.json`)
  }
}

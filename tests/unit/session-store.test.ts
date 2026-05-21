import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createSession, SessionStore } from '../../src/session/session-store.js'

const TEST_SESSIONS_DIR = '/tmp/spectre-test-sessions'

describe('SessionStore', () => {
  beforeEach(() => {
    fs.rmSync(TEST_SESSIONS_DIR, { recursive: true, force: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_SESSIONS_DIR, { recursive: true, force: true })
  })

  it('should save and list sessions newest first', () => {
    const store = new SessionStore(TEST_SESSIONS_DIR)
    const first = createSession('First')
    first.id = 'session-first'
    first.updatedAt = '2026-01-01T00:00:00.000Z'
    const second = createSession('Second')
    second.id = 'session-second'
    second.updatedAt = '2026-01-02T00:00:00.000Z'

    store.save(first)
    store.save(second)

    const sessions = store.list()
    expect(sessions).toHaveLength(2)
    expect(sessions[0].id).toBe('session-second')
    expect(sessions[1].id).toBe('session-first')
  })

  it('should append messages and persist them with private permissions', () => {
    const store = new SessionStore(TEST_SESSIONS_DIR)
    const session = createSession('Chat')
    session.id = 'session-chat'
    store.save(session)

    store.appendMessage('session-chat', 'user', 'hello')
    store.appendMessage('session-chat', 'tool', 'hi there')

    const loaded = store.read('session-chat')
    const fileMode = fs.statSync(path.join(TEST_SESSIONS_DIR, 'session-chat.json')).mode & 0o777

    expect(loaded?.messages.map((message) => message.content)).toEqual(['hello', 'hi there'])
    expect(fileMode).toBe(0o600)
  })
})

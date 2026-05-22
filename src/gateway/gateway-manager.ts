import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const STATE_DIR = join(process.env.HOME || '~', '.spectre', 'gateway')
const PID_FILE = join(STATE_DIR, 'gateway.pid')
const LOG_FILE = join(STATE_DIR, 'gateway.log')
const TOKEN_FILE = join(STATE_DIR, 'gateway.token')

export class GatewayManager {
  constructor() {
    if (!existsSync(STATE_DIR)) {
      mkdirSync(STATE_DIR, { recursive: true, mode: 0o700 })
    }
  }

  getStoredToken(): string | null {
    if (!existsSync(TOKEN_FILE)) return null
    const raw = readFileSync(TOKEN_FILE, 'utf-8').trim()
    return raw || null
  }

  saveToken(token: string): void {
    writeFileSync(TOKEN_FILE, token, { mode: 0o600 })
  }

  startTelegram(token: string): string {
    if (this.isRunning()) {
      return 'Spectre gateway is already running.'
    }

    this.saveToken(token)

    const gatewayScript = new URL('./index.js', import.meta.url)
    const child = spawn(process.execPath, [fileURLToPath(gatewayScript)], {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      env: { ...process.env, SPECTRE_TELEGRAM_BOT_TOKEN: token, SPECTRE_GATEWAY_LOG: LOG_FILE },
    })

    child.unref()
    writeFileSync(PID_FILE, String(child.pid), { mode: 0o600 })
    writeFileSync(LOG_FILE, `Started Telegram gateway with PID ${child.pid}\n`, { flag: 'a', mode: 0o600 })

    return `Started Telegram gateway (PID ${child.pid}).`
  }

  stop(): string {
    const pid = this.getPid()
    if (!pid) return 'Spectre gateway is not running.'

    try {
      process.kill(pid, 'SIGTERM')
      // Give process time to shut down before clearing pid
      setTimeout(() => {
        writeFileSync(PID_FILE, '', { mode: 0o600 })
        writeFileSync(LOG_FILE, 'Gateway stopped.\n', { flag: 'a', mode: 0o600 })
      }, 1000)
      return `Stopped Spectre gateway (PID ${pid}).`
    } catch (error) {
      writeFileSync(PID_FILE, '', { mode: 0o600 })
      return `Failed to stop gateway: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  config(newToken?: string): string {
    if (newToken) {
      this.saveToken(newToken)
      return `Gateway token updated. Run /gateway start to start with the new token.`
    }
    const stored = this.getStoredToken()
    if (stored) {
      return `Gateway token is configured (${stored.substring(0, 8)}...). Run /gateway start to launch.`
    }
    return 'No gateway token configured. Run /gateway config <token> to set one.'
  }

  status(): string {
    const pid = this.getPid()
    if (!pid) return 'Spectre gateway is stopped.'
    return this.isProcessAlive(pid) ? `Spectre gateway is running (PID ${pid}).` : 'Spectre gateway pid file exists but process is not running.'
  }

  logs(): string {
    if (!existsSync(LOG_FILE)) return 'No gateway logs found.'
    return readFileSync(LOG_FILE, 'utf-8') || 'Gateway log is empty.'
  }

  isRunning(): boolean {
    const pid = this.getPid()
    return pid !== null && this.isProcessAlive(pid)
  }

  private getPid(): number | null {
    if (!existsSync(PID_FILE)) return null
    const raw = readFileSync(PID_FILE, 'utf-8').trim()
    if (!raw) return null
    const pid = Number(raw)
    return Number.isInteger(pid) ? pid : null
  }

  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }
}

export function getGatewayStateDir(): string {
  return dirname(PID_FILE)
}

import log from 'loglevel'
import { join } from 'path'
import { existsSync, mkdirSync, appendFileSync } from 'fs'

interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: Record<string, unknown>
  error?: { message: string; stack?: string }
  duration?: number
}

const isDev = process.env.NODE_ENV !== 'production'
const logDir = join(process.env.HOME || '~', '.spectre', 'logs')

// Initialize log directory
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true, mode: 0o700 })
}

const logFile = join(logDir, 'spectre.log')

log.setDefaultLevel(isDev ? 'debug' : 'info')

// Enhanced logger with structured logging
export const logger = {
  debug: (...args: unknown[]) => {
    log.debug(...args)
    const [msg, context] = extractContext(args)
    logToFile('DEBUG', msg, context)
  },
  
  info: (...args: unknown[]) => {
    log.info(...args)
    const [msg, context] = extractContext(args)
    logToFile('INFO', msg, context)
  },
  
  warn: (...args: unknown[]) => {
    log.warn(...args)
    const [msg, context] = extractContext(args)
    logToFile('WARN', msg, context)
  },
  
  error: (...args: unknown[]) => {
    log.error(...args)
    
    let errorObj: { message: string; stack?: string } | undefined
    
    if (args.length >= 2) {
      const second = args[1]
      if (second instanceof Error) {
        errorObj = { message: second.message, stack: second.stack }
      }
    }
    
    const messageStr = String(args[0] || '')
    logToFile('ERROR', messageStr, undefined, errorObj)
  },
  
  performance: (label: string, duration: number, context?: Record<string, unknown>) => {
    log.info(`⏱️ ${label}: ${duration}ms`)
    logToFile('PERF', label, { ...context, duration })
  },
  
  // Expose original log methods for compatibility
  trace: log.trace,
  setLevel: log.setLevel,
  getLevel: log.getLevel,
}

function extractContext(args: unknown[]): [string, Record<string, unknown> | undefined] {
  const messageParts: string[] = []
  let context: Record<string, unknown> | undefined
  
  for (const arg of args) {
    if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
      context = arg as Record<string, unknown>
    } else if (typeof arg === 'string') {
      messageParts.push(arg)
    } else {
      messageParts.push(String(arg))
    }
  }
  
  return [messageParts.join(' '), context]
}

function logToFile(
  level: string,
  message: string,
  context?: Record<string, unknown> | unknown,
  error?: { message: string; stack?: string },
): void {
  try {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }
    
    if (context && typeof context === 'object') {
      entry.context = context as Record<string, unknown>
    }
    
    if (error) {
      entry.error = error
    }
    
    appendFileSync(logFile, JSON.stringify(entry) + '\n', { mode: 0o600 })
  } catch (err) {
    // Silently fail if we can't write to log file
    console.error('Failed to write to log file:', err instanceof Error ? err.message : String(err))
  }
}

export function setLogLevel(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'): void {
  log.setLevel(level)
}

export function getLogFile(): string {
  return logFile
}

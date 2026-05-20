import log from 'loglevel'

const isDev = process.env.NODE_ENV !== 'production'

log.setDefaultLevel(isDev ? 'debug' : 'info')

export const logger = log

export function setLogLevel(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'): void {
  log.setLevel(level)
}

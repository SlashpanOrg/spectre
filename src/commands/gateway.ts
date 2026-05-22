import { GatewayManager } from '../gateway/gateway-manager.js'

export const gatewayCommand = {
  name: 'gateway',
  description: 'Manage the Spectre Telegram gateway',
  usage: '/gateway <start|stop|status|config|logs> [telegram-bot-token]',
  execute: async (args: string = ''): Promise<string> => {
    const [action, token] = args.split(/\s+/).filter(Boolean)
    const manager = new GatewayManager()

    switch (action) {
      case 'start': {
        const telegramToken = token || manager.getStoredToken() || process.env.SPECTRE_TELEGRAM_BOT_TOKEN
        if (!telegramToken) {
          return 'No token found. Set one via:\n  /gateway config <telegram-bot-token>\n  /gateway start <telegram-bot-token>\n  Or set SPECTRE_TELEGRAM_BOT_TOKEN env variable.\n\nCreate a bot with @BotFather on Telegram to get a token.'
        }
        return manager.startTelegram(telegramToken)
      }
      case 'stop':
        return manager.stop()
      case 'status':
        return manager.status()
      case 'config':
        return manager.config(token)
      case 'logs':
        return manager.logs()
      default:
        return 'Usage: /gateway <start|stop|status|config|logs> [telegram-bot-token]'
    }
  },
}

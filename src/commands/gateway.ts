import { GatewayManager } from '../gateway/gateway-manager.js'

export const gatewayCommand = {
  name: 'gateway',
  description: 'Manage the Spectre Telegram gateway',
  usage: '/gateway <start|stop|status|logs> [telegram-bot-token]',
  execute: async (args: string = ''): Promise<string> => {
    const [action, token] = args.split(/\s+/).filter(Boolean)
    const manager = new GatewayManager()

    switch (action) {
      case 'start': {
        const telegramToken = token || process.env.SPECTRE_TELEGRAM_BOT_TOKEN
        if (!telegramToken) {
          return 'Usage: /gateway start <telegram-bot-token>\nCreate a bot with @BotFather and pass the token here.'
        }
        return manager.startTelegram(telegramToken)
      }
      case 'stop':
        return manager.stop()
      case 'status':
        return manager.status()
      case 'logs':
        return manager.logs()
      default:
        return 'Usage: /gateway <start|stop|status|logs> [telegram-bot-token]'
    }
  },
}

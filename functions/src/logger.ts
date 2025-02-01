import { TelegramLogger } from '@monkhai/telelogger'
import { defineSecret } from 'firebase-functions/params'

export const TELELOGGER_CHAT_ID = defineSecret('TELELOGGER_CHAT_ID')
export const TELELOGGER_TOKEN = defineSecret('TELELOGGER_TOKEN')

export const telelogger = new TelegramLogger({
  botToken: TELELOGGER_TOKEN.value(),
  chatId: Number(TELELOGGER_CHAT_ID.value()),
})

import { InternalBotConfig } from '@eventflow/shared';
import { Bot, InlineKeyboard } from 'grammy';

import ConversationStore from '../conversation/store';
import GeminiAgent from '../gemini/agent';
import { logger } from '../logger';
import RateLimiter from '../ratelimit';

const DEFAULT_WELCOME =
    '¡Hola! Soy Yonaiker, el asistente de este evento. Puedo contarte sobre la ubicación, los horarios, ' +
    'los tipos de entrada y sus precios. ¿En qué te ayudo?';

const SUGGESTIONS =
    '\n\nPuedes preguntarme cosas como:\n' +
    '• ¿Dónde es el evento?\n' +
    '• ¿Qué entradas hay y cuánto cuestan?\n' +
    '• ¿Quedan entradas disponibles?' +
    '\n\nTambién puedo ayudarte con la compra de las entradas.';

const ERROR_MESSAGE =
    'Estoy teniendo problemas en este momento 😞. Por favor, intenta de nuevo en unos minutos.';

export interface BotDependencies {
    agent: GeminiAgent;
    store: ConversationStore;
    rateLimiter: RateLimiter;
}

export function createBotInstance(botConfig: InternalBotConfig, deps: BotDependencies): Bot {
    const { agent, store, rateLimiter } = deps;
    const bot = new Bot(botConfig.telegramBotToken);

    const welcome = botConfig.welcomeMessage?.trim() || DEFAULT_WELCOME;
    const conversationKey = (chatId: number): string => `${botConfig.eventId}:${chatId}`;

    bot.command('start', async (ctx) => {
        await ctx.reply(`${welcome}${SUGGESTIONS}`);
    });

    bot.on('message:text', async (ctx) => {
        const chatId = ctx.chat.id;
        const key = conversationKey(chatId);

        if (!rateLimiter.allow(key)) {
            await ctx.reply('Vas muy rápido 😅. Espera un momento e intenta de nuevo.');
            return;
        }

        try {
            await ctx.replyWithChatAction('typing');

            const history = store.getHistory(key);
            const result = await agent.processMessage({
                botConfig,
                history,
                userText: ctx.message.text,
            });
            store.setHistory(key, result.history);

            if (result.handoffUrl) {
                const keyboard = new InlineKeyboard().url(
                    '💬 Continuar por WhatsApp',
                    result.handoffUrl,
                );
                await ctx.reply(result.text, { reply_markup: keyboard });
            } else {
                await ctx.reply(result.text);
            }
        } catch (error) {
            logger.error('Error procesando mensaje', {
                eventId: botConfig.eventId,
                error: String(error),
            });
            try {
                await ctx.reply(ERROR_MESSAGE);
            } catch {}
        }
    });

    bot.catch((err) => {
        logger.error('Error no controlado en bot de Telegram', {
            eventId: botConfig.eventId,
            error: String(err.error),
        });
    });

    return bot;
}

import { InternalBotConfig } from '@eventflow/shared';
import { Bot } from 'grammy';

import ApiClient from './api/client';
import { config } from './config';
import ConversationStore from './conversation/store';
import GeminiAgent from './gemini/agent';
import { logger } from './logger';
import RateLimiter from './ratelimit';
import { createBotInstance } from './telegram/botInstance';

interface RunningBot {
    bot: Bot;
    token: string;
    updatedAt: string;
}

export default class BotRegistry {
    private running = new Map<string, RunningBot>();
    private pollTimer: NodeJS.Timeout | null = null;
    private agent: GeminiAgent;

    constructor(
        private apiClient: ApiClient,
        private store: ConversationStore,
        private rateLimiter: RateLimiter,
    ) {
        this.agent = new GeminiAgent(apiClient);
    }

    start(): void {
        void this.poll();
        this.pollTimer = setInterval(() => void this.poll(), config.botPollIntervalMs);
    }

    private async poll(): Promise<void> {
        let configs: InternalBotConfig[];
        try {
            configs = await this.apiClient.getConfigs();
        } catch (error) {
            logger.error('No se pudieron obtener las configs del bot', { error: String(error) });
            return;
        }

        const seen = new Set<string>();

        for (const cfg of configs) {
            seen.add(cfg.eventId);
            const current = this.running.get(cfg.eventId);

            if (!current) {
                await this.startBot(cfg);
            } else if (
                current.token !== cfg.telegramBotToken ||
                current.updatedAt !== cfg.updatedAt
            ) {
                logger.info('Reiniciando bot por cambio de configuración', {
                    eventId: cfg.eventId,
                });
                await this.stopBot(cfg.eventId);
                await this.startBot(cfg);
            }
        }

        // Detener bots ya no elegibles (deshabilitados, evento no ACTIVE, o eliminados).
        for (const eventId of this.running.keys()) {
            if (!seen.has(eventId)) {
                logger.info('Deteniendo bot no elegible', { eventId });
                await this.stopBot(eventId);
            }
        }
    }

    private async startBot(cfg: InternalBotConfig): Promise<void> {
        const bot = createBotInstance(cfg, {
            agent: this.agent,
            store: this.store,
            rateLimiter: this.rateLimiter,
        });

        try {
            // Valida el token contra Telegram antes de comprometer la instancia.
            await bot.init();
        } catch (error) {
            logger.error('Token de Telegram inválido; no se arranca el bot', {
                eventId: cfg.eventId,
                error: String(error),
            });
            return;
        }

        // Long polling en segundo plano; no se await (corre hasta detenerse).
        void bot.start({
            onStart: () => {
                logger.info('Bot arrancado', { eventId: cfg.eventId });
            },
        });

        this.running.set(cfg.eventId, {
            bot,
            token: cfg.telegramBotToken,
            updatedAt: cfg.updatedAt,
        });
    }

    private async stopBot(eventId: string): Promise<void> {
        const current = this.running.get(eventId);
        if (!current) return;
        try {
            await current.bot.stop();
        } catch (error) {
            logger.error('Error deteniendo bot', { eventId, error: String(error) });
        }
        this.running.delete(eventId);
    }

    async stopAll(): Promise<void> {
        if (this.pollTimer) clearInterval(this.pollTimer);
        this.pollTimer = null;
        await Promise.all([...this.running.keys()].map((eventId) => this.stopBot(eventId)));
    }
}

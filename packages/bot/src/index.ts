import ApiClient from './api/client';
import { config } from './config';
import ConversationStore from './conversation/store';
import { logger } from './logger';
import RateLimiter from './ratelimit';
import BotRegistry from './registry';

function main(): void {
    const apiClient = new ApiClient();
    const store = new ConversationStore();
    const rateLimiter = new RateLimiter();
    const registry = new BotRegistry(apiClient, store, rateLimiter);

    registry.start();
    logger.info('Worker del bot iniciado', {
        apiBaseUrl: config.apiBaseUrl,
        pollIntervalMs: config.botPollIntervalMs,
    });

    const shutdown = (signal: string): void => {
        logger.info(`Recibido ${signal}. Deteniendo worker...`);
        void (async (): Promise<void> => {
            await registry.stopAll();
            store.stop();
            logger.info('Worker detenido.');
            process.exit(0);
        })();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main();

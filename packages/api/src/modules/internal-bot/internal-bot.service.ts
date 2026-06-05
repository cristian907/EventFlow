import { InternalBotConfig } from '@eventflow/shared';

import IEventBotConfigRepository from '../../core/interfaces/repositories/IEventBotConfigRepository';
import BotTokenCipher from '../../infrastructure/BotTokenCipher';
import { logger } from '../../infrastructure/logger';

export default class InternalBotService {
    constructor(
        private botConfigRepository: IEventBotConfigRepository,
        private cipher: BotTokenCipher,
    ) {}

    /**
     * Configs habilitadas de eventos ACTIVE, con el token DESCIFRADO, para que el worker
     * registre/actualice las instancias de bot. Las configs cuyo token no se pueda descifrar
     * se omiten (se loguea) en lugar de tumbar la respuesta.
     */
    public async getEnabledConfigs(): Promise<InternalBotConfig[]> {
        const configs = await this.botConfigRepository.findAllEnabledActive();

        const result: InternalBotConfig[] = [];
        for (const config of configs) {
            if (!config.telegramBotTokenEncrypted) continue;
            try {
                const telegramBotToken = this.cipher.decrypt(config.telegramBotTokenEncrypted);
                result.push({
                    eventId: config.eventId,
                    telegramBotToken,
                    salesWhatsappNumber: config.salesWhatsappNumber,
                    salesHandoffMessage: config.salesHandoffMessage,
                    welcomeMessage: config.welcomeMessage,
                    updatedAt: config.updatedAt.toISOString(),
                });
            } catch (error) {
                logger.error('No se pudo descifrar el token del bot', {
                    eventId: config.eventId,
                    error: String(error),
                });
            }
        }
        return result;
    }
}

import { BotConfig } from '@eventflow/shared';

import EventBotConfig from '../../core/entities/EventBotConfig';

export default class BotConfigMapper {
    /**
     * Mapea la config a un DTO seguro para el frontend: el token NUNCA se expone en claro,
     * solo se devuelve enmascarado (últimos 4 caracteres del token descifrado).
     */
    public static toBotConfigDTO(
        config: EventBotConfig | null,
        eventId: string,
        decryptToken: (encrypted: string) => string,
    ): BotConfig {
        if (!config) {
            return {
                eventId,
                hasToken: false,
                tokenMask: null,
                salesWhatsappNumber: null,
                salesHandoffMessage: null,
                welcomeMessage: null,
                isEnabled: false,
                createdAt: null,
                updatedAt: null,
            };
        }

        let tokenMask: string | null = null;
        if (config.telegramBotTokenEncrypted) {
            try {
                const decrypted = decryptToken(config.telegramBotTokenEncrypted);
                tokenMask = `••••${decrypted.slice(-4)}`;
            } catch {
                tokenMask = '••••';
            }
        }

        return {
            eventId: config.eventId,
            hasToken: Boolean(config.telegramBotTokenEncrypted),
            tokenMask,
            salesWhatsappNumber: config.salesWhatsappNumber,
            salesHandoffMessage: config.salesHandoffMessage,
            welcomeMessage: config.welcomeMessage,
            isEnabled: config.isEnabled,
            createdAt: config.createdAt.toISOString(),
            updatedAt: config.updatedAt.toISOString(),
        };
    }
}

import {
    BotConfig,
    BotConfigToUpsertType,
    BotConfigTestType,
    BotConfigTestResult,
} from '@eventflow/shared';

import { EventNotFoundError, InvalidBotTokenError } from '../../core/errors/BusinessErrors';
import IEventBotConfigRepository from '../../core/interfaces/repositories/IEventBotConfigRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import BotTokenCipher from '../../infrastructure/BotTokenCipher';
import { logger } from '../../infrastructure/logger';

import BotConfigMapper from './bot-config.mapper';

interface TelegramGetMeResponse {
    ok: boolean;
    result?: { username?: string };
}

export default class BotConfigService {
    constructor(
        private botConfigRepository: IEventBotConfigRepository,
        private eventRepository: IEventRepository,
        private cipher: BotTokenCipher,
    ) {}

    private decryptFn = (encrypted: string): string => this.cipher.decrypt(encrypted);

    public async getConfig(eventId: string): Promise<BotConfig> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const config = await this.botConfigRepository.findByEventId(eventId);
        return BotConfigMapper.toBotConfigDTO(config, eventId, this.decryptFn);
    }

    public async upsertConfig(eventId: string, data: BotConfigToUpsertType): Promise<BotConfig> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        // El token solo se cifra y persiste si el admin lo envía; si viene vacío/ausente,
        // se conserva el existente (no se sobrescribe).
        const encryptedToken =
            data.telegramBotToken !== undefined
                ? this.cipher.encrypt(data.telegramBotToken)
                : undefined;

        const upserted = await this.botConfigRepository.upsert(eventId, {
            telegramBotTokenEncrypted: encryptedToken,
            salesWhatsappNumber: data.salesWhatsappNumber ?? null,
            salesHandoffMessage: data.salesHandoffMessage ?? null,
            welcomeMessage: data.welcomeMessage ?? null,
            isEnabled: data.isEnabled,
        });

        return BotConfigMapper.toBotConfigDTO(upserted, eventId, this.decryptFn);
    }

    /**
     * Valida un token contra `getMe` de Telegram sin habilitar el bot. Usa el token del body si
     * viene; si no, intenta el token guardado descifrado.
     */
    public async testToken(eventId: string, data: BotConfigTestType): Promise<BotConfigTestResult> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        let token = data.telegramBotToken;
        if (!token) {
            const config = await this.botConfigRepository.findByEventId(eventId);
            if (config?.telegramBotTokenEncrypted) {
                token = this.cipher.decrypt(config.telegramBotTokenEncrypted);
            }
        }
        if (!token) throw new InvalidBotTokenError();

        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const body = (await response.json()) as TelegramGetMeResponse;
            return {
                ok: Boolean(body.ok),
                botUsername: body.ok ? (body.result?.username ?? null) : null,
            };
        } catch (error) {
            logger.warn('Error al validar token de Telegram', { error: String(error) });
            return { ok: false, botUsername: null };
        }
    }
}

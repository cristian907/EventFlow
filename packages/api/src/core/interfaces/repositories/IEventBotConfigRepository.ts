import EventBotConfig from '../../entities/EventBotConfig';

export interface EventBotConfigUpsertData {
    // Si es `undefined`, NO se sobrescribe el token existente.
    telegramBotTokenEncrypted?: string;
    salesWhatsappNumber?: string | null;
    salesHandoffMessage?: string | null;
    welcomeMessage?: string | null;
    isEnabled?: boolean;
}

export default interface IEventBotConfigRepository {
    findByEventId(eventId: string): Promise<EventBotConfig | null>;

    upsert(eventId: string, data: EventBotConfigUpsertData): Promise<EventBotConfig>;

    /**
     * Devuelve las configuraciones habilitadas (`isEnabled = true`) cuyo evento esté en
     * estado `ACTIVE`. Usado por el endpoint interno que alimenta al worker del bot.
     */
    findAllEnabledActive(): Promise<EventBotConfig[]>;
}

import { BotConfig, BotConfigToUpsertType, BotConfigTestResult } from '@eventflow/shared';

import { api } from '../../../services/axios';

export const botConfigService = {
    async get(eventId: string): Promise<BotConfig> {
        const response = await api.get<{ botConfig: BotConfig }>(`/events/${eventId}/bot-config`);
        return response.data.botConfig;
    },

    async upsert(eventId: string, data: BotConfigToUpsertType): Promise<BotConfig> {
        const response = await api.put<{ botConfig: BotConfig }>(
            `/events/${eventId}/bot-config`,
            data,
        );
        return response.data.botConfig;
    },

    async test(eventId: string, telegramBotToken?: string): Promise<BotConfigTestResult> {
        const response = await api.post<BotConfigTestResult>(`/events/${eventId}/bot-config/test`, {
            telegramBotToken,
        });
        return response.data;
    },
};

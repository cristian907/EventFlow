import { SystemSettingsType } from '@eventflow/shared';

import { api } from '../../../services/axios';

export const settingsService = {
    async getSettings(): Promise<SystemSettingsType> {
        const response = await api.get<SystemSettingsType>('/admin/settings');
        return response.data;
    },

    async updateSettings(data: SystemSettingsType): Promise<SystemSettingsType> {
        const response = await api.put<SystemSettingsType>('/admin/settings', data);
        return response.data;
    },
};

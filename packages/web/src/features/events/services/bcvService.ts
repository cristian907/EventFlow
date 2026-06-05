import { BcvRateType } from '@eventflow/shared';

import { api } from '../../../services/axios';

export const bcvService = {
    async getRate(): Promise<BcvRateType> {
        const response = await api.get<BcvRateType>('/exchange-rates/bcv');
        return response.data;
    },

    async syncRate(): Promise<BcvRateType> {
        const response = await api.post<BcvRateType>('/exchange-rates/bcv/sync');
        return response.data;
    },
};

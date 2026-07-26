import {
    ExchangeRateType,
    ExchangeRateToCreateType,
    CurrentExchangeRateResponse,
} from '@eventflow/shared';

import { api } from '../../../services/axios';

export const exchangeRateService = {
    async getCurrent(eventId: string): Promise<CurrentExchangeRateResponse> {
        const response = await api.get<CurrentExchangeRateResponse>(
            `/events/${eventId}/exchange-rates/current`,
        );
        return response.data;
    },

    async list(eventId: string): Promise<ExchangeRateType[]> {
        const response = await api.get<{ exchangeRates: ExchangeRateType[] }>(
            `/events/${eventId}/exchange-rates`,
        );
        return response.data.exchangeRates;
    },

    async create(eventId: string, data: ExchangeRateToCreateType): Promise<ExchangeRateType> {
        const response = await api.post<{ exchangeRate: ExchangeRateType }>(
            `/events/${eventId}/exchange-rates`,
            data,
        );
        return response.data.exchangeRate;
    },
};

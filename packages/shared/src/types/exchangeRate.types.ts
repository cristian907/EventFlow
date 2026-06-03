import { ExchangeRateToCreate } from '../schemas/exchangeRate.schemas';

export interface ExchangeRateType {
    id: string;
    eventId: string;
    rate: number;
    source: 'manual' | 'bcv';
    setBy?: string;
    setByName?: string;
    effectiveAt: string;
    createdAt: string;
}

export interface CurrentExchangeRateResponse {
    current: ExchangeRateType | null;
}

export type ExchangeRateToCreateType = ExchangeRateToCreate;

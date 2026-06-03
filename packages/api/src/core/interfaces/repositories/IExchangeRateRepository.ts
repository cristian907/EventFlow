import ExchangeRate from '../../entities/ExchangeRate';

export default interface IExchangeRateRepository {
    create(data: {
        eventId: string;
        rate: number;
        source: 'manual' | 'bcv';
        setBy?: string;
        effectiveAt: Date;
    }): Promise<ExchangeRate>;

    findCurrentByEventId(eventId: string): Promise<ExchangeRate | null>;

    findAllByEventId(eventId: string): Promise<ExchangeRate[]>;
}

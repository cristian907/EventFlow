import { ExchangeRateType, ExchangeRateToCreateType } from '@eventflow/shared';

import { EventNotFoundError } from '../../core/errors/BusinessErrors';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';

import ExchangeRatesMapper from './exchange-rates.mapper';

export default class ExchangeRatesService {
    constructor(
        private exchangeRateRepository: IExchangeRateRepository,
        private eventRepository: IEventRepository,
    ) {}

    public async create(
        eventId: string,
        data: ExchangeRateToCreateType,
        setBy?: string,
        source: 'manual' | 'bcv' | 'paralelo' = 'manual',
    ): Promise<ExchangeRateType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const created = await this.exchangeRateRepository.create({
            eventId,
            rate: data.rate,
            source,
            setBy,
            effectiveAt: new Date(),
        });
        return ExchangeRatesMapper.toExchangeRateType(created);
    }

    public async getCurrent(eventId: string): Promise<ExchangeRateType | null> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const current = await this.exchangeRateRepository.findCurrentByEventId(eventId);
        return current ? ExchangeRatesMapper.toExchangeRateType(current) : null;
    }

    public async list(eventId: string): Promise<ExchangeRateType[]> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const rates = await this.exchangeRateRepository.findAllByEventId(eventId);
        return rates.map(ExchangeRatesMapper.toExchangeRateType);
    }
}

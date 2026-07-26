import { ExchangeRateType } from '@eventflow/shared';

import ExchangeRate from '../../core/entities/ExchangeRate';

export default class ExchangeRatesMapper {
    static toExchangeRateType(entity: ExchangeRate): ExchangeRateType {
        return {
            id: entity.id,
            eventId: entity.eventId,
            rate: entity.rate,
            source: entity.source,
            setBy: entity.setBy ?? undefined,
            setByName: entity.setByName ?? undefined,
            effectiveAt: entity.effectiveAt.toISOString(),
            createdAt: entity.createdAt.toISOString(),
        };
    }
}

import { BcvRateType } from '@eventflow/shared';

import BcvRate from '../../core/entities/BcvRate';

export default class BcvMapper {
    static toBcvRateType(entity: BcvRate, isStale: boolean, ageMs: number): BcvRateType {
        return {
            usdRate: entity.usdRate,
            eurRate: entity.eurRate,
            valueDate: entity.valueDate ? entity.valueDate.toISOString() : undefined,
            scrapedAt: entity.scrapedAt.toISOString(),
            isStale,
            ageMs,
        };
    }
}

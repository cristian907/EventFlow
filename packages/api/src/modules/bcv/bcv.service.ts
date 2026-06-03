import { BcvRateType } from '@eventflow/shared';

import { BcvProvider } from '../../infrastructure/bcv/provider';

import BcvMapper from './bcv.mapper';

export default class BcvService {
    constructor(private bcvProvider: BcvProvider) {}

    public async getRate(): Promise<BcvRateType> {
        const { rate, isStale, ageMs } = await this.bcvProvider.getRate();
        return BcvMapper.toBcvRateType(rate, isStale, ageMs);
    }

    public async syncRate(): Promise<BcvRateType> {
        const rate = await this.bcvProvider.refresh();
        return BcvMapper.toBcvRateType(rate, false, 0);
    }
}

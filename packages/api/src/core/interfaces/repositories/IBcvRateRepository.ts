import BcvRate from '../../entities/BcvRate';

export default interface IBcvRateRepository {
    create(data: {
        usdRate: number;
        eurRate: number;
        usdtRate: number | null;
        valueDate: Date | null;
        scrapedAt: Date;
    }): Promise<BcvRate>;

    findLatest(): Promise<BcvRate | null>;
}

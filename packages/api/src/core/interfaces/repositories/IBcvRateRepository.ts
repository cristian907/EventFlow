import BcvRate from '../../entities/BcvRate';

export default interface IBcvRateRepository {
    create(data: {
        usdRate: number;
        eurRate: number;
        valueDate: Date | null;
        scrapedAt: Date;
    }): Promise<BcvRate>;

    findLatest(): Promise<BcvRate | null>;
}

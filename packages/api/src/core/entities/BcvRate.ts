export default class BcvRate {
    constructor(
        public id: string,
        public usdRate: number,
        public eurRate: number,
        public usdtRate: number | null,
        public valueDate: Date | null,
        public scrapedAt: Date,
        public createdAt: Date,
    ) {}
}

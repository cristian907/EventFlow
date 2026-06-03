export default class BcvRate {
    constructor(
        public id: string,
        public usdRate: number,
        public eurRate: number,
        public valueDate: Date | null,
        public scrapedAt: Date,
        public createdAt: Date,
    ) {}
}

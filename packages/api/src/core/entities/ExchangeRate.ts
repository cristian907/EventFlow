export default class ExchangeRate {
    constructor(
        public id: string,
        public eventId: string,
        public rate: number,
        public source: 'manual' | 'bcv',
        public setBy: string | null,
        public setByName: string | null,
        public effectiveAt: Date,
        public createdAt: Date,
    ) {}
}

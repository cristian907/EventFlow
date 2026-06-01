export default class ExchangeRate {
    constructor(
        public id: string,
        public eventId: string,
        public rate: number,
        public setBy: string,
        public setByName: string,
        public effectiveAt: Date,
        public createdAt: Date,
    ) {}
}

export default class TicketType {
    constructor(
        public id: string,
        public eventId: string,
        public name: string,
        public description: string,
        public price: number,
        public usdPrice: number,
        public currency: string,
        public totalQuantity: number,
        public soldQuantity: number,
        public isActive: boolean,
        public saleStartsAt: Date | null,
        public saleEndsAt: Date | null,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}

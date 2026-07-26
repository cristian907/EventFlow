export default class PaymentMethod {
    constructor(
        public id: string,
        public eventId: string,
        public name: string,
        public details: string,
        public currency: string,
        public isActive: boolean,
        public createdAt: Date,
        public updatedAt: Date,
    ) {}
}

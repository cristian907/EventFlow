export interface OrderItem {
    id: string;
    orderId: string;
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    subtotal: number;
}

export interface OrderPayment {
    id: string;
    orderId: string;
    paymentMethodId: string;
    paymentMethodName: string;
    amount: number;
    currency: string;
    reference: string | null;
    receiptUrl: string | null;
    status: string;
    verifiedById: string;
    verifiedAt: Date;
}

export interface OrderCustomer {
    id: string;
    idNumber: string;
    fullName: string;
    phone: string | null;
    email: string | null;
}

export default class Order {
    constructor(
        public readonly id: string,
        public readonly eventId: string,
        public readonly customerId: string,
        public readonly soldById: string,
        public readonly soldByName: string,
        public readonly exchangeRateId: string,
        public readonly exchangeRate: number,
        public readonly currency: string,
        public readonly totalAmount: number,
        public readonly createdAt: Date,
        public readonly customer?: OrderCustomer,
        public readonly items?: OrderItem[],
        public readonly payments?: OrderPayment[],
    ) {}
}

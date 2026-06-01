import PaymentMethod from '../../entities/PaymentMethod';

export default interface IPaymentMethodRepository {
    create(data: {
        eventId: string;
        name: string;
        details: string;
        currency: string;
    }): Promise<PaymentMethod>;

    findById(id: string): Promise<PaymentMethod | null>;

    findByEventId(eventId: string): Promise<PaymentMethod[]>;

    update(
        id: string,
        data: {
            name?: string;
            details?: string;
            currency?: string;
            isActive?: boolean;
        },
    ): Promise<PaymentMethod>;
}

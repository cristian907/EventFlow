import TicketType from '../../entities/TicketType';
import { ITransactionContext } from '../ITransactionContext';

export default interface ITicketTypeRepository {
    create(data: {
        eventId: string;
        name: string;
        description: string;
        price: number;
        usdPrice: number;
        currency: string;
        totalQuantity: number;
        saleStartsAt?: Date | null;
        saleEndsAt?: Date | null;
    }): Promise<TicketType>;

    findById(id: string): Promise<TicketType | null>;

    findByEventId(eventId: string, includeInactive?: boolean): Promise<TicketType[]>;

    update(
        id: string,
        data: {
            name?: string;
            description?: string;
            price?: number;
            usdPrice?: number;
            currency?: string;
            totalQuantity?: number;
            isActive?: boolean;
            saleStartsAt?: Date | null;
            saleEndsAt?: Date | null;
        },
    ): Promise<TicketType>;

    sumTotalQuantityByEventId(eventId: string, excludeId?: string): Promise<number>;

    decrementSoldQuantityAtomic(
        id: string,
        qty: number,
        tx?: ITransactionContext,
    ): Promise<boolean>;
}

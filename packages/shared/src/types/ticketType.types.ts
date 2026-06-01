import { TicketTypeToCreate, TicketTypeToUpdate } from '../schemas/ticketType.schemas';

export type Currency = 'USD' | 'VES';

export interface TicketTypeType {
    id: string;
    eventId: string;
    name: string;
    description: string;
    price: number;
    currency: Currency;
    totalQuantity: number;
    soldQuantity: number;
    availableQuantity: number;
    isActive: boolean;
    saleStartsAt: string | null;
    saleEndsAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type TicketTypeToCreateType = TicketTypeToCreate;
export type TicketTypeToUpdateType = TicketTypeToUpdate;

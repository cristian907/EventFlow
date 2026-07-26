import { PublicEvent, PublicTicketType, PublicAvailability, Currency } from '@eventflow/shared';

import Event from '../../core/entities/Event';
import TicketType from '../../core/entities/TicketType';

export default class PublicEventsMapper {
    public static toPublicEvent(event: Event): PublicEvent {
        return {
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            address: event.address,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            status: event.status,
        };
    }

    public static toPublicTicketType(tt: TicketType): PublicTicketType {
        return {
            id: tt.id,
            name: tt.name,
            description: tt.description,
            price: tt.price,
            currency: tt.currency as Currency,
            available: Math.max(0, tt.totalQuantity - tt.soldQuantity),
            saleStartsAt: tt.saleStartsAt ? tt.saleStartsAt.toISOString() : null,
            saleEndsAt: tt.saleEndsAt ? tt.saleEndsAt.toISOString() : null,
        };
    }

    public static toPublicAvailability(tt: TicketType): PublicAvailability {
        return {
            ticketTypeId: tt.id,
            name: tt.name,
            available: Math.max(0, tt.totalQuantity - tt.soldQuantity),
        };
    }
}

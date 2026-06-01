import { TicketTypeType } from '@eventflow/shared';

import TicketType from '../../core/entities/TicketType';

/** Converts a Date to ISO string. Returns null if the date is null or invalid. */
function safeIso(date: Date | null): string | null {
    if (!date) return null;
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    return date.toISOString();
}

export default class TicketTypesMapper {
    public static toTicketTypeType(entity: TicketType): TicketTypeType {
        return {
            id: entity.id,
            eventId: entity.eventId,
            name: entity.name,
            description: entity.description,
            price: entity.price,
            currency: entity.currency as TicketTypeType['currency'],
            totalQuantity: entity.totalQuantity,
            soldQuantity: entity.soldQuantity,
            availableQuantity: entity.totalQuantity - entity.soldQuantity,
            isActive: entity.isActive,
            saleStartsAt: safeIso(entity.saleStartsAt),
            saleEndsAt: safeIso(entity.saleEndsAt),
            createdAt: safeIso(entity.createdAt) ?? '',
            updatedAt: safeIso(entity.updatedAt) ?? '',
        };
    }
}

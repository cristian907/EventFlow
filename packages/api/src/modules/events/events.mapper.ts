import { EventType } from '@eventflow/shared';

import Event from '../../core/entities/Event';

/** Converts a Date to ISO string. Returns null if the date is invalid (e.g. corrupted DB value). */
function safeIso(date: Date): string | null {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    return date.toISOString();
}

export default class EventsMapper {
    public static toEventType(event: Event): EventType {
        return {
            id: event.id,
            organizerId: event.organizerId,
            imageUrl: event.imageUrl,
            name: event.name,
            description: event.description,
            startDate: safeIso(event.startDate) ?? '',
            endDate: safeIso(event.endDate) ?? '',
            startTime: safeIso(event.startTime) ?? '',
            endTime: safeIso(event.endTime) ?? '',
            location: event.location,
            address: event.address,
            maxCapacity: event.maxCapacity,
            status: event.status,
            autoSyncBcv: event.autoSyncBcv,
            createdAt: safeIso(event.createdAt) ?? '',
            updatedAt: safeIso(event.updatedAt) ?? '',
        };
    }
}

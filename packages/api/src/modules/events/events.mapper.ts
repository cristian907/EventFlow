import { EventType } from '@eventflow/shared';

import Event from '../../core/entities/Event';

export default class EventsMapper {
    public static toEventType(event: Event): EventType {
        return {
            id: event.id,
            organizerId: event.organizerId,
            imageUrl: event.imageUrl,
            name: event.name,
            description: event.description,
            date: event.date.toISOString(),
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            location: event.location,
            address: event.address,
            maxCapacity: event.maxCapacity,
            status: event.status,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
        };
    }
}

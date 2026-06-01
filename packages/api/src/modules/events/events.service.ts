import { EventType, EventToCreateType, EventStatus as SharedEventStatus } from '@eventflow/shared';

import { EventStatus } from '../../core/entities/Event';
import { EventNotFoundError, ForbiddenError } from '../../core/errors/BusinessErrors';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';

import EventsMapper from './events.mapper';

export default class EventsService {
    constructor(private eventRepository: IEventRepository) {}

    public async createEvent(
        organizerId: string,
        eventData: EventToCreateType,
    ): Promise<EventType> {
        const defaultImageUrl =
            'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80';

        // Parse date strings to JS Date objects
        const parsedStartDate = new Date(eventData.startDate);
        const parsedEndDate = new Date(eventData.endDate);
        const parsedStartTime = new Date(eventData.startTime);
        const parsedEndTime = new Date(eventData.endTime);

        const createdEvent = await this.eventRepository.create({
            organizerId,
            name: eventData.name,
            description: eventData.description,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            location: eventData.location,
            address: eventData.address,
            maxCapacity: eventData.maxCapacity,
            imageUrl: eventData.imageUrl || defaultImageUrl,
        });

        return EventsMapper.toEventType(createdEvent);
    }

    public async listEvents(options: {
        page: number;
        limit: number;
        search?: string;
        status?: SharedEventStatus;
        userId: string;
        userRole: string;
    }): Promise<{ events: EventType[]; total: number; totalPages: number }> {
        const { page, limit, search, status, userId, userRole } = options;

        let domainStatus: EventStatus | undefined;
        if (status === 'DRAFT') domainStatus = EventStatus.Draft;
        if (status === 'ACTIVE') domainStatus = EventStatus.Active;
        if (status === 'CANCELLED') domainStatus = EventStatus.Cancelled;

        // Global ADMIN sees all events; regular global USER sees only events they are members of
        const filterUserId = userRole === 'ADMIN' ? undefined : userId;

        const { events, total } = await this.eventRepository.findAndCount({
            page,
            limit,
            search,
            status: domainStatus,
            userId: filterUserId,
        });

        return {
            events: events.map((e) => EventsMapper.toEventType(e)),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    public async getEventDetail(
        eventId: string,
        userId: string,
        userRole: string,
    ): Promise<{ event: EventType; eventRole: string }> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new EventNotFoundError(eventId);
        }

        // Global ADMIN gets access automatically and has implicit 'ADMIN' role in the event context
        if (userRole === 'ADMIN') {
            return {
                event: EventsMapper.toEventType(event),
                eventRole: 'ADMIN',
            };
        }

        // Check if global USER is registered in the event
        const memberRole = await this.eventRepository.getMemberRole(eventId, userId);
        if (!memberRole) {
            throw new ForbiddenError();
        }

        return {
            event: EventsMapper.toEventType(event),
            eventRole: memberRole,
        };
    }
}

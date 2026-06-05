import {
    EventType,
    EventToCreateType,
    EventToUpdateType,
    EventStatus as SharedEventStatus,
} from '@eventflow/shared';

import { EventStatus } from '../../core/entities/Event';
import {
    EventNotFoundError,
    ForbiddenError,
    MaxCapacityBelowAssignedError,
} from '../../core/errors/BusinessErrors';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import EventsMapper from './events.mapper';

export default class EventsService {
    constructor(
        private eventRepository: IEventRepository,
        private ticketTypeRepository: ITicketTypeRepository,
    ) {}

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
            autoSyncBcv: eventData.autoSyncBcv,
            rateSource: eventData.rateSource || (eventData.autoSyncBcv ? 'USD_BCV' : 'CUSTOM'),
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

    public async updateEvent(eventId: string, data: EventToUpdateType): Promise<EventType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        if (data.maxCapacity !== undefined) {
            const totalAssigned =
                await this.ticketTypeRepository.sumTotalQuantityByEventId(eventId);
            if (data.maxCapacity < totalAssigned) {
                throw new MaxCapacityBelowAssignedError(data.maxCapacity, totalAssigned);
            }
        }

        const payload: Parameters<IEventRepository['update']>[1] = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.description !== undefined) payload.description = data.description;
        if (data.location !== undefined) payload.location = data.location;
        if (data.address !== undefined) payload.address = data.address;
        if (data.maxCapacity !== undefined) payload.maxCapacity = data.maxCapacity;
        if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
        if (data.startDate !== undefined) payload.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) payload.endDate = new Date(data.endDate);
        if (data.startTime !== undefined) payload.startTime = new Date(data.startTime);
        if (data.endTime !== undefined) payload.endTime = new Date(data.endTime);
        if (data.autoSyncBcv !== undefined) {
            payload.autoSyncBcv = data.autoSyncBcv;
            payload.rateSource = data.autoSyncBcv ? 'USD_BCV' : 'CUSTOM';
        }
        if (data.rateSource !== undefined) {
            payload.rateSource = data.rateSource;
            payload.autoSyncBcv = data.rateSource !== 'CUSTOM';
        }

        if (data.status !== undefined) {
            let statusEnum: EventStatus;
            if (data.status === 'DRAFT') statusEnum = EventStatus.Draft;
            else if (data.status === 'ACTIVE') statusEnum = EventStatus.Active;
            else if (data.status === 'CANCELLED') statusEnum = EventStatus.Cancelled;
            else throw new Error(`Invalid status: ${data.status}`);
            payload.status = statusEnum;
        }

        const updated = await this.eventRepository.update(eventId, payload);

        if (payload.rateSource === 'CUSTOM') {
            const ticketTypes = await this.ticketTypeRepository.findByEventId(eventId, true);
            for (const tt of ticketTypes) {
                await this.ticketTypeRepository.update(tt.id, {
                    price: tt.usdPrice,
                    currency: 'USD',
                });
            }
        }

        return EventsMapper.toEventType(updated);
    }
}

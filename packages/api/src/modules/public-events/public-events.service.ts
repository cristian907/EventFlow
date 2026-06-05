import { PublicEvent, PublicTicketType, PublicAvailability } from '@eventflow/shared';

import { EventStatus } from '../../core/entities/Event';
import { EventNotPublicError, TicketTypeNotFoundError } from '../../core/errors/BusinessErrors';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import PublicEventsMapper from './public-events.mapper';

export default class PublicEventsService {
    constructor(
        private eventRepository: IEventRepository,
        private ticketTypeRepository: ITicketTypeRepository,
    ) {}

    private async getActiveEventOrThrow(eventId: string): Promise<void> {
        const event = await this.eventRepository.findById(eventId);
        if (!event || event.status !== EventStatus.Active) {
            throw new EventNotPublicError();
        }
    }

    public async getEvent(eventId: string): Promise<PublicEvent> {
        const event = await this.eventRepository.findById(eventId);
        if (!event || event.status !== EventStatus.Active) {
            throw new EventNotPublicError();
        }
        return PublicEventsMapper.toPublicEvent(event);
    }

    public async getTicketTypes(eventId: string): Promise<PublicTicketType[]> {
        await this.getActiveEventOrThrow(eventId);
        const ticketTypes = await this.ticketTypeRepository.findByEventId(eventId, false);
        return ticketTypes.map(PublicEventsMapper.toPublicTicketType);
    }

    public async getAvailability(
        eventId: string,
        ticketTypeId?: string,
    ): Promise<PublicAvailability[]> {
        await this.getActiveEventOrThrow(eventId);

        if (ticketTypeId) {
            const tt = await this.ticketTypeRepository.findById(ticketTypeId);
            if (!tt || tt.eventId !== eventId || !tt.isActive) {
                throw new TicketTypeNotFoundError(ticketTypeId);
            }
            return [PublicEventsMapper.toPublicAvailability(tt)];
        }

        const ticketTypes = await this.ticketTypeRepository.findByEventId(eventId, false);
        return ticketTypes.map(PublicEventsMapper.toPublicAvailability);
    }
}

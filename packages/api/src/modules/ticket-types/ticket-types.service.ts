import { TicketTypeType, TicketTypeToCreateType, TicketTypeToUpdateType } from '@eventflow/shared';

import {
    EventNotFoundError,
    CapacityExceededError,
    InvalidQuantityError,
    TicketTypeNotFoundError,
    InvalidSaleWindowError,
} from '../../core/errors/BusinessErrors';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import TicketTypesMapper from './ticket-types.mapper';

export default class TicketTypesService {
    constructor(
        private ticketTypeRepository: ITicketTypeRepository,
        private eventRepository: IEventRepository,
    ) {}

    public async create(eventId: string, data: TicketTypeToCreateType): Promise<TicketTypeType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        if (data.saleEndsAt) {
            const saleEndsDate = new Date(data.saleEndsAt);
            if (saleEndsDate > event.endTime) {
                throw new InvalidSaleWindowError();
            }
        }

        // Validate capacity
        const currentSum = await this.ticketTypeRepository.sumTotalQuantityByEventId(eventId);
        if (currentSum + data.totalQuantity > event.maxCapacity) {
            throw new CapacityExceededError(event.maxCapacity, currentSum, data.totalQuantity);
        }

        const created = await this.ticketTypeRepository.create({
            eventId,
            name: data.name,
            description: data.description ?? '',
            price: data.price,
            currency: data.currency ?? 'USD',
            totalQuantity: data.totalQuantity,
            saleStartsAt: data.saleStartsAt ? new Date(data.saleStartsAt) : null,
            saleEndsAt: data.saleEndsAt ? new Date(data.saleEndsAt) : null,
        });

        return TicketTypesMapper.toTicketTypeType(created);
    }

    public async list(
        eventId: string,
        includeInactive = true,
    ): Promise<{ ticketTypes: TicketTypeType[]; maxCapacity: number; totalAssigned: number }> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const ticketTypes = await this.ticketTypeRepository.findByEventId(eventId, includeInactive);
        const totalAssigned = ticketTypes.reduce((sum, tt) => sum + tt.totalQuantity, 0);

        return {
            ticketTypes: ticketTypes.map(TicketTypesMapper.toTicketTypeType),
            maxCapacity: event.maxCapacity,
            totalAssigned,
        };
    }

    public async getById(eventId: string, ticketTypeId: string): Promise<TicketTypeType> {
        const ticketType = await this.ticketTypeRepository.findById(ticketTypeId);
        if (!ticketType || ticketType.eventId !== eventId) {
            throw new TicketTypeNotFoundError(ticketTypeId);
        }
        return TicketTypesMapper.toTicketTypeType(ticketType);
    }

    public async update(
        eventId: string,
        ticketTypeId: string,
        data: TicketTypeToUpdateType,
    ): Promise<TicketTypeType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        if (data.saleEndsAt) {
            const saleEndsDate = new Date(data.saleEndsAt);
            if (saleEndsDate > event.endTime) {
                throw new InvalidSaleWindowError();
            }
        }

        const existing = await this.ticketTypeRepository.findById(ticketTypeId);
        if (!existing || existing.eventId !== eventId) {
            throw new TicketTypeNotFoundError(ticketTypeId);
        }

        // Validate totalQuantity >= soldQuantity
        if (data.totalQuantity !== undefined && data.totalQuantity < existing.soldQuantity) {
            throw new InvalidQuantityError(existing.soldQuantity);
        }

        // Validate capacity if totalQuantity is being changed
        if (data.totalQuantity !== undefined && data.totalQuantity !== existing.totalQuantity) {
            const currentSum = await this.ticketTypeRepository.sumTotalQuantityByEventId(
                eventId,
                ticketTypeId,
            );
            if (currentSum + data.totalQuantity > event.maxCapacity) {
                throw new CapacityExceededError(event.maxCapacity, currentSum, data.totalQuantity);
            }
        }

        const updatePayload: Record<string, unknown> = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.price !== undefined) updatePayload.price = data.price;
        if (data.currency !== undefined) updatePayload.currency = data.currency;
        if (data.totalQuantity !== undefined) updatePayload.totalQuantity = data.totalQuantity;
        if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
        if (data.saleStartsAt !== undefined) {
            updatePayload.saleStartsAt = data.saleStartsAt ? new Date(data.saleStartsAt) : null;
        }
        if (data.saleEndsAt !== undefined) {
            updatePayload.saleEndsAt = data.saleEndsAt ? new Date(data.saleEndsAt) : null;
        }

        const updated = await this.ticketTypeRepository.update(
            ticketTypeId,
            updatePayload as Parameters<ITicketTypeRepository['update']>[1],
        );
        return TicketTypesMapper.toTicketTypeType(updated);
    }

    public async deactivate(eventId: string, ticketTypeId: string): Promise<TicketTypeType> {
        const existing = await this.ticketTypeRepository.findById(ticketTypeId);
        if (!existing || existing.eventId !== eventId) {
            throw new TicketTypeNotFoundError(ticketTypeId);
        }

        const updated = await this.ticketTypeRepository.update(ticketTypeId, { isActive: false });
        return TicketTypesMapper.toTicketTypeType(updated);
    }
}

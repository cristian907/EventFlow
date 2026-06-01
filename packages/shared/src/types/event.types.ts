import { EventToCreate } from '../schemas/event.schemas';

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'CANCELLED';

export type EventMemberRole = 'ORGANIZER' | 'ADMIN' | 'COLLABORATOR' | 'SCANNER';

export interface EventType {
    id: string;
    organizerId: string;
    imageUrl: string;
    name: string;
    description: string;
    startDate: Date | string;
    endDate: Date | string;
    startTime: Date | string;
    endTime: Date | string;
    location: string;
    address: string;
    maxCapacity: number;
    status: EventStatus;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export type EventToCreateType = EventToCreate;

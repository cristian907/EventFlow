import Event, { EventStatus } from '../../entities/Event';

export default interface IEventRepository {
    create(eventData: {
        organizerId: string;
        name: string;
        description: string;
        startDate: Date;
        endDate: Date;
        startTime: Date;
        endTime: Date;
        location: string;
        address: string;
        maxCapacity: number;
        imageUrl: string;
        rateSource?: string;
        autoSyncBcv?: boolean;
    }): Promise<Event>;

    findById(id: string): Promise<Event | null>;

    findAndCount(options: {
        page: number;
        limit: number;
        search?: string;
        status?: EventStatus;
        userId?: string; // If provided, lists events where user is organizer OR member
    }): Promise<{ events: Event[]; total: number }>;

    update(
        id: string,
        data: {
            name?: string;
            description?: string;
            startDate?: Date;
            endDate?: Date;
            startTime?: Date;
            endTime?: Date;
            location?: string;
            address?: string;
            maxCapacity?: number;
            imageUrl?: string;
            rateSource?: string;
            autoSyncBcv?: boolean;
        },
    ): Promise<Event>;

    getMemberRole(eventId: string, userId: string): Promise<string | null>;

    createMember(eventId: string, userId: string, role: string): Promise<void>;

    findActiveAutoSyncEvents(): Promise<Event[]>;
}

import Event, { EventStatus } from '../../entities/Event';

export default interface IEventRepository {
    create(eventData: {
        organizerId: string;
        name: string;
        description: string;
        date: Date;
        startTime: Date;
        endTime: Date;
        location: string;
        address: string;
        maxCapacity: number;
        imageUrl: string;
    }): Promise<Event>;

    findById(id: string): Promise<Event | null>;

    findAndCount(options: {
        page: number;
        limit: number;
        search?: string;
        status?: EventStatus;
        userId?: string; // If provided, lists events where user is organizer OR member
    }): Promise<{ events: Event[]; total: number }>;

    getMemberRole(eventId: string, userId: string): Promise<string | null>;

    createMember(eventId: string, userId: string, role: string): Promise<void>;
}

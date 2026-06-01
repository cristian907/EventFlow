import { StaffMemberType } from '@eventflow/shared';

export default interface IEventMemberRepository {
    listByEvent(
        eventId: string,
        options: { page: number; limit: number; search?: string },
    ): Promise<{ members: StaffMemberType[]; total: number }>;

    findMember(eventId: string, userId: string): Promise<StaffMemberType | null>;

    findMemberById(eventId: string, memberId: string): Promise<StaffMemberType | null>;

    create(eventId: string, userId: string, role: string): Promise<StaffMemberType>;

    update(memberId: string, data: { role?: string; status?: string }): Promise<StaffMemberType>;

    countActiveAdmins(eventId: string): Promise<number>;
}

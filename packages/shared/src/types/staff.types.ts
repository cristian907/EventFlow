import { StaffToCreate, StaffToUpdate } from '../schemas/staff.schemas';

export type StaffToCreateType = StaffToCreate;
export type StaffToUpdateType = StaffToUpdate;

export type StaffMemberType = {
    id: string;
    eventId: string;
    userId: string;
    role: 'organizer' | 'admin' | 'collaborator' | 'scanner';
    status: 'active' | 'inactive';
    createdAt: Date | string;
    user: {
        id: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        isActive: boolean;
    };
};

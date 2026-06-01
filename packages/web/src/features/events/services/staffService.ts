import { StaffMemberType, StaffToCreateType, StaffToUpdateType } from '@eventflow/shared';

import { api } from '../../../services/axios';

export interface ListStaffResponse {
    members: StaffMemberType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    activeAdminsCount: number;
}

export const staffService = {
    async listStaff(
        eventId: string,
        params?: { search?: string; page?: number; limit?: number },
    ): Promise<ListStaffResponse> {
        const response = await api.get<ListStaffResponse>(`/events/${eventId}/staff`, { params });
        return response.data;
    },

    async addStaff(eventId: string, data: StaffToCreateType): Promise<StaffMemberType> {
        const response = await api.post<StaffMemberType>(`/events/${eventId}/staff`, data);
        return response.data;
    },

    async searchUserByEmail(
        eventId: string,
        email: string,
    ): Promise<{
        exists: boolean;
        user?: { fullName: string; email: string; phoneNumber: string };
        suggestions?: Array<{ fullName: string; email: string; phoneNumber: string }>;
    }> {
        const response = await api.get<{
            exists: boolean;
            user?: { fullName: string; email: string; phoneNumber: string };
            suggestions?: Array<{ fullName: string; email: string; phoneNumber: string }>;
        }>(`/events/${eventId}/staff/search-user`, {
            params: { email },
        });
        return response.data;
    },

    async updateStaff(
        eventId: string,
        memberId: string,
        data: StaffToUpdateType,
    ): Promise<StaffMemberType> {
        const response = await api.put<StaffMemberType>(
            `/events/${eventId}/staff/${memberId}`,
            data,
        );
        return response.data;
    },

    async removeStaff(eventId: string, memberId: string): Promise<void> {
        await api.delete(`/events/${eventId}/staff/${memberId}`);
    },
};

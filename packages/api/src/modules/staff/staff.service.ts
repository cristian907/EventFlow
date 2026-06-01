import { StaffMemberType, StaffToCreateType, StaffToUpdateType } from '@eventflow/shared';
import { hash } from 'bcrypt';

import User from '../../core/entities/User';
import {
    EventNotFoundError,
    DuplicateMemberError,
    EventMemberNotFoundError,
    RemoveLastAdminError,
    PasswordRequiredError,
    ModifyOrganizerError,
} from '../../core/errors/BusinessErrors';
import { EnvironmentVariableError } from '../../core/errors/InternalServerErrors';
import IEventMemberRepository from '../../core/interfaces/repositories/IEventMemberRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';

export default class StaffService {
    private readonly saltRounds: number;

    constructor(
        private eventMemberRepository: IEventMemberRepository,
        private userRepository: IUserRepository,
        private eventRepository: IEventRepository,
    ) {
        const { BCRYPT_SALT_ROUNDS } = process.env;
        if (!BCRYPT_SALT_ROUNDS) {
            throw new EnvironmentVariableError('BCRYPT_SALT_ROUNDS');
        }
        this.saltRounds = parseInt(BCRYPT_SALT_ROUNDS, 10);
    }

    public async list(
        eventId: string,
        options: { page: number; limit: number; search?: string },
    ): Promise<{ members: StaffMemberType[]; total: number; activeAdminsCount: number }> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const { members, total } = await this.eventMemberRepository.listByEvent(eventId, options);
        const activeAdminsCount = await this.eventMemberRepository.countActiveAdmins(eventId);

        return { members, total, activeAdminsCount };
    }

    public async searchUsers(email: string): Promise<{ users: User[]; total: number }> {
        return this.userRepository.findAndCount({ page: 1, limit: 10, emailSearch: email });
    }

    public async create(
        eventId: string,
        data: StaffToCreateType,
        adminUserId: string,
    ): Promise<StaffMemberType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        let user = await this.userRepository.findByEmail(data.email);
        if (!user) {
            if (!data.password) {
                throw new PasswordRequiredError();
            }
            // Create user
            const passwordHash = await hash(data.password, this.saltRounds);

            user = await this.userRepository.create({
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                password: passwordHash,
                createdBy: adminUserId,
            });
        }

        // Check if member already exists
        const existingMember = await this.eventMemberRepository.findMember(eventId, user.id);
        if (existingMember) {
            throw new DuplicateMemberError();
        }

        return this.eventMemberRepository.create(eventId, user.id, data.role);
    }

    public async getById(eventId: string, memberId: string): Promise<StaffMemberType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const member = await this.eventMemberRepository.findMemberById(eventId, memberId);
        if (!member) throw new EventMemberNotFoundError(memberId);

        return member;
    }

    public async update(
        eventId: string,
        memberId: string,
        data: StaffToUpdateType,
    ): Promise<StaffMemberType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const member = await this.eventMemberRepository.findMemberById(eventId, memberId);
        if (!member) throw new EventMemberNotFoundError(memberId);

        if (member.role === 'organizer') {
            throw new ModifyOrganizerError();
        }

        // Guard against removing last admin
        const isCurrentlyAdmin = member.role === 'admin';
        const willNoLongerBeAdmin =
            (data.role && data.role !== 'admin') || data.status === 'inactive';

        if (isCurrentlyAdmin && willNoLongerBeAdmin) {
            const activeAdmins = await this.eventMemberRepository.countActiveAdmins(eventId);
            if (activeAdmins <= 1) {
                throw new RemoveLastAdminError();
            }
        }

        return this.eventMemberRepository.update(memberId, data);
    }

    public async deactivate(eventId: string, memberId: string): Promise<void> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const member = await this.eventMemberRepository.findMemberById(eventId, memberId);
        if (!member) throw new EventMemberNotFoundError(memberId);

        if (member.role === 'organizer') {
            throw new ModifyOrganizerError();
        }

        const isCurrentlyAdmin = member.role === 'admin';
        if (isCurrentlyAdmin) {
            const activeAdmins = await this.eventMemberRepository.countActiveAdmins(eventId);
            if (activeAdmins <= 1) {
                throw new RemoveLastAdminError();
            }
        }

        await this.eventMemberRepository.update(memberId, { status: 'inactive' });
    }
}

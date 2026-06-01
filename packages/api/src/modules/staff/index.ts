import { Router } from 'express';

import IEventMemberRepository from '../../core/interfaces/repositories/IEventMemberRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';

import StaffController from './staff.controller';
import createStaffRoutes from './staff.routes';
import StaffService from './staff.service';

export function createStaffModule(
    eventMemberRepository: IEventMemberRepository,
    userRepository: IUserRepository,
    eventRepository: IEventRepository,
): Router {
    const staffService = new StaffService(eventMemberRepository, userRepository, eventRepository);
    const staffController = new StaffController(staffService);
    const staffRoutes = createStaffRoutes(staffController);

    return staffRoutes;
}

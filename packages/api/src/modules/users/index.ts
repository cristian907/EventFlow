import { Router } from 'express';

import IUserRepository from '../../core/interfaces/repositories/IUserRepository';

import UsersController from './users.controller';
import createUsersRoutes from './users.routes';
import UsersService from './users.service';

export function createUsersModule(userRepository: IUserRepository): Router {
    const usersService = new UsersService(userRepository);
    const usersController = new UsersController(usersService);
    const usersRoutes = createUsersRoutes(usersController);

    return usersRoutes;
}

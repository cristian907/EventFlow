import { UpdateUserRoleSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeAdmin } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import UsersController from './users.controller';

export default function createUsersRoutes(usersController: UsersController): Router {
    const router = Router();

    // Protect all user routes globally for Admin role
    router.use(authMiddleware, authorizeAdmin);

    router.get('/', usersController.list);
    router.put('/:userId/role', validateSchema(UpdateUserRoleSchema), usersController.updateRole);

    return router;
}

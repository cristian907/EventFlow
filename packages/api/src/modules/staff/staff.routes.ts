import { StaffToCreateSchema, StaffToUpdateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import StaffController from './staff.controller';

export default function createStaffRoutes(staffController: StaffController): Router {
    const router = Router({ mergeParams: true });

    // Protect all routes with auth + event admin role
    router.use(authMiddleware, authorizeEventRole('admin'));

    // GET /events/:eventId/staff
    router.get('/', staffController.list);

    // POST /events/:eventId/staff
    router.post('/', validateSchema(StaffToCreateSchema), staffController.create);

    // GET /events/:eventId/staff/search-user
    router.get('/search-user', staffController.searchUserByEmail);

    // GET /events/:eventId/staff/:memberId
    router.get('/:memberId', staffController.getById);

    // PUT /events/:eventId/staff/:memberId
    router.put('/:memberId', validateSchema(StaffToUpdateSchema), staffController.update);

    // DELETE /events/:eventId/staff/:memberId (baja lógica)
    router.delete('/:memberId', staffController.deactivate);

    return router;
}

import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';

import DashboardController from './dashboard.controller';

export default function createDashboardRoutes(dashboardController: DashboardController): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware);

    router.get('/', authorizeEventRole('admin'), dashboardController.getSummary);

    router.get('/stream', authorizeEventRole('admin'), dashboardController.getStream);

    return router;
}

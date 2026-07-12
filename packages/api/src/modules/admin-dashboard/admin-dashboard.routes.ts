import { Router } from 'express';

import authMiddleware, { authorizeAdmin } from '../../infrastructure/http/authMiddleware';

import AdminDashboardController from './admin-dashboard.controller';

export default function createAdminDashboardRoutes(
    adminDashboardController: AdminDashboardController,
): Router {
    const router = Router();

    router.use(authMiddleware, authorizeAdmin);

    router.get('/', adminDashboardController.getGlobalSummary);

    return router;
}

import { Router } from 'express';

import IDashboardRepository from '../../core/interfaces/repositories/IDashboardRepository';

import AdminDashboardController from './admin-dashboard.controller';
import createAdminDashboardRoutes from './admin-dashboard.routes';
import AdminDashboardService from './admin-dashboard.service';

export function createAdminDashboardModule(dashboardRepository: IDashboardRepository): Router {
    const adminDashboardService = new AdminDashboardService(dashboardRepository);
    const adminDashboardController = new AdminDashboardController(adminDashboardService);
    const adminDashboardRoutes = createAdminDashboardRoutes(adminDashboardController);

    return adminDashboardRoutes;
}

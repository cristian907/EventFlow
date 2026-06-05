import { Router } from 'express';

import IDashboardRepository from '../../core/interfaces/repositories/IDashboardRepository';

import DashboardController from './dashboard.controller';
import createDashboardRoutes from './dashboard.routes';
import DashboardService from './dashboard.service';

export function createDashboardModule(dashboardRepository: IDashboardRepository): Router {
    const dashboardService = new DashboardService(dashboardRepository);
    const dashboardController = new DashboardController(dashboardService);
    const dashboardRoutes = createDashboardRoutes(dashboardController);

    return dashboardRoutes;
}

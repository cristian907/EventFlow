import { GlobalDashboardQuerySchema } from '@eventflow/shared';
import { NextFunction, Request, Response } from 'express';

import AdminDashboardService from './admin-dashboard.service';

export default class AdminDashboardController {
    constructor(private readonly adminDashboardService: AdminDashboardService) {}

    getGlobalSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Parse and validate query parameters
            const query = GlobalDashboardQuerySchema.parse(req.query);
            const summary = await this.adminDashboardService.getGlobalSummary(query);
            res.json(summary);
        } catch (error) {
            next(error);
        }
    };
}

import { Request, Response, NextFunction } from 'express';

import UsersService from './users.service';

export default class UsersController {
    constructor(private usersService: UsersService) {}

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const search = req.query.search ? String(req.query.search) : undefined;
            const role = req.query.role ? String(req.query.role) : undefined;

            const result = await this.usersService.listUsers({
                page,
                limit,
                search,
                role,
            });

            res.json({
                users: result.users,
                total: result.total,
                page,
                limit,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    };

    updateActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = req.params;
            const { isActive } = req.body;

            const updatedUser = await this.usersService.updateUserActive(
                String(userId),
                Boolean(isActive),
            );

            res.json({ user: updatedUser });
        } catch (error) {
            next(error);
        }
    };
}

import { NextFunction, Request, Response } from 'express';

import { requestContext } from '../../infrastructure/http/authMiddleware';

import StaffService from './staff.service';

export default class StaffController {
    constructor(private staffService: StaffService) {}

    searchUserByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const email = String(req.query.email || '').trim();
            if (!email || email.length < 3) {
                res.json({ exists: false, suggestions: [] });
                return;
            }
            const { users } = await this.staffService.searchUsers(email);
            const exactMatch = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

            res.json({
                exists: !!exactMatch,
                user: exactMatch
                    ? {
                          fullName: exactMatch.name,
                          email: exactMatch.email,
                          phoneNumber: exactMatch.phoneNumber,
                      }
                    : undefined,
                suggestions: users.map((u) => ({
                    fullName: u.name,
                    email: u.email,
                    phoneNumber: u.phoneNumber,
                })),
            });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const store = requestContext.getStore();
            const adminUserId = store?.userId || '';

            const member = await this.staffService.create(eventId, req.body, adminUserId);
            res.status(201).json(member);
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const search = req.query.search ? String(req.query.search) : undefined;

            const { members, total, activeAdminsCount } = await this.staffService.list(eventId, {
                page,
                limit,
                search,
            });

            const totalPages = Math.ceil(total / limit);

            res.json({
                members,
                total,
                page,
                limit,
                totalPages,
                activeAdminsCount,
            });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const memberId = String(req.params.memberId);

            const member = await this.staffService.getById(eventId, memberId);
            res.json(member);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const memberId = String(req.params.memberId);

            const member = await this.staffService.update(eventId, memberId, req.body);
            res.json(member);
        } catch (error) {
            next(error);
        }
    };

    deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const memberId = String(req.params.memberId);

            await this.staffService.deactivate(eventId, memberId);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    };
}

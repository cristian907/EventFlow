import { SSE_EVENTS } from '@eventflow/shared';
import { NextFunction, Request, Response } from 'express';

import { eventCheckInEmitter } from '../../infrastructure/EventCheckInEmitter';

import DashboardService from './dashboard.service';

export default class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const summary = await this.dashboardService.getSummary(eventId);
            res.json(summary);
        } catch (error) {
            next(error);
        }
    };

    getStream = async (req: Request, res: Response): Promise<void> => {
        const eventId = String(req.params.eventId);

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Establish connection immediately

        // Send initial ping to keep-alive
        res.write(':ping\n\n');

        // Subscribe client to the emitter
        const unsubscribe = eventCheckInEmitter.subscribeCheckIn(eventId, (event) => {
            res.write(`event: ${SSE_EVENTS.CHECK_IN}\n`);
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        });

        // Send periodic heartbeats
        const heartbeatInterval = setInterval(() => {
            res.write(':ping\n\n');
        }, 15000); // 15 seconds

        // Clean up when client disconnects
        req.on('close', () => {
            clearInterval(heartbeatInterval);
            unsubscribe();
            res.end();
        });
    };
}

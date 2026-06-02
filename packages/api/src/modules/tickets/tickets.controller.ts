import { NextFunction, Request, Response } from 'express';
import QRCode from 'qrcode';

import TicketsService from './tickets.service';

export default class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    listByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const orderId = String(req.params.orderId);
            const result = await this.ticketsService.listByOrder(eventId, orderId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketId = String(req.params.ticketId);
            const { ticket, qrBase64 } = await this.ticketsService.getTicketForDownload(
                eventId,
                ticketId,
            );

            const qrPng = await QRCode.toBuffer(qrBase64, {
                type: 'png',
                width: 400,
                margin: 2,
            });

            res.set({
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="ticket-${ticket.qrCode.slice(0, 8)}.png"`,
            });
            res.send(qrPng);
        } catch (error) {
            next(error);
        }
    };

    verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { qrData } = req.body;
            const ticket = await this.ticketsService.verifyAndMarkUsed(qrData);
            res.json({
                valid: true,
                ticketId: ticket.id,
                message: 'Ticket verificado exitosamente.',
            });
        } catch (error) {
            next(error);
        }
    };
}

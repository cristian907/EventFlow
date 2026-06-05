import { Request, Response, NextFunction } from 'express';

import BotConfigService from './bot-config.service';

export default class BotConfigController {
    constructor(private botConfigService: BotConfigService) {}

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const config = await this.botConfigService.getConfig(eventId);
            res.json({ botConfig: config });
        } catch (error) {
            next(error);
        }
    };

    upsert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const config = await this.botConfigService.upsertConfig(eventId, req.body);
            res.json({ botConfig: config });
        } catch (error) {
            next(error);
        }
    };

    test = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const result = await this.botConfigService.testToken(eventId, req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}

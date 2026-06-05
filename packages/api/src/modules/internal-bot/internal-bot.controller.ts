import { Request, Response, NextFunction } from 'express';

import InternalBotService from './internal-bot.service';

export default class InternalBotController {
    constructor(private internalBotService: InternalBotService) {}

    getConfigs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const configs = await this.internalBotService.getEnabledConfigs();
            res.json({ configs });
        } catch (error) {
            next(error);
        }
    };
}

import { Request, Response, NextFunction } from 'express';

import BcvService from './bcv.service';

export default class BcvController {
    constructor(private bcvService: BcvService) {}

    getRate = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.bcvService.getRate();
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    syncRate = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.bcvService.syncRate();
            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}

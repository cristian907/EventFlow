import { UpdateSettingsSchema } from '@eventflow/shared';
import { NextFunction, Request, Response } from 'express';

import SettingsService from './settings.service';

export default class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const settings = await this.settingsService.getSettings();
            res.json(settings);
        } catch (error) {
            next(error);
        }
    };

    updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const validated = UpdateSettingsSchema.parse(req.body);
            const updated = await this.settingsService.updateSettings(validated);
            res.json(updated);
        } catch (error) {
            next(error);
        }
    };
}

import { Router } from 'express';

import { PrismaClient } from '../../generated/prisma/client';

import SettingsController from './settings.controller';
import createSettingsRoutes from './settings.routes';
import SettingsService from './settings.service';

export function createSettingsModule(prisma: PrismaClient): Router {
    const settingsService = new SettingsService(prisma);
    const settingsController = new SettingsController(settingsService);
    const settingsRoutes = createSettingsRoutes(settingsController);

    return settingsRoutes;
}

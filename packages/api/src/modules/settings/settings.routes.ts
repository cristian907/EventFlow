import { Router } from 'express';

import authMiddleware, { authorizeAdmin } from '../../infrastructure/http/authMiddleware';

import SettingsController from './settings.controller';

export default function createSettingsRoutes(settingsController: SettingsController): Router {
    const router = Router();

    // Settings are only accessible and mutable by global ADMIN users
    router.use(authMiddleware, authorizeAdmin);

    router.get('/', settingsController.getSettings);
    router.put('/', settingsController.updateSettings);

    return router;
}

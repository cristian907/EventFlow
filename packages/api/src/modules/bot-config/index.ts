import { Router } from 'express';

import IEventBotConfigRepository from '../../core/interfaces/repositories/IEventBotConfigRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import BotTokenCipher from '../../infrastructure/BotTokenCipher';

import BotConfigController from './bot-config.controller';
import createBotConfigRoutes from './bot-config.routes';
import BotConfigService from './bot-config.service';

export function createBotConfigModule(
    botConfigRepository: IEventBotConfigRepository,
    eventRepository: IEventRepository,
    cipher: BotTokenCipher,
): Router {
    const botConfigService = new BotConfigService(botConfigRepository, eventRepository, cipher);
    const botConfigController = new BotConfigController(botConfigService);
    return createBotConfigRoutes(botConfigController);
}

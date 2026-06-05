import { Router } from 'express';

import IEventBotConfigRepository from '../../core/interfaces/repositories/IEventBotConfigRepository';
import BotTokenCipher from '../../infrastructure/BotTokenCipher';

import InternalBotController from './internal-bot.controller';
import createInternalBotRoutes from './internal-bot.routes';
import InternalBotService from './internal-bot.service';

export function createInternalBotModule(
    botConfigRepository: IEventBotConfigRepository,
    cipher: BotTokenCipher,
): Router {
    const internalBotService = new InternalBotService(botConfigRepository, cipher);
    const internalBotController = new InternalBotController(internalBotService);
    return createInternalBotRoutes(internalBotController);
}

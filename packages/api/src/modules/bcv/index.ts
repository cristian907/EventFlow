import { Router } from 'express';

import { BcvProvider } from '../../infrastructure/bcv/provider';

import BcvController from './bcv.controller';
import { createBcvRouter } from './bcv.routes';
import BcvService from './bcv.service';

export function createBcvModule(bcvProvider: BcvProvider): Router {
    const bcvService = new BcvService(bcvProvider);
    const bcvController = new BcvController(bcvService);
    return createBcvRouter(bcvController);
}

import { Router } from 'express';

import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';

import ExchangeRatesController from './exchange-rates.controller';
import createExchangeRatesRoutes from './exchange-rates.routes';
import ExchangeRatesService from './exchange-rates.service';

export function createExchangeRatesModule(
    exchangeRateRepository: IExchangeRateRepository,
    eventRepository: IEventRepository,
): Router {
    const exchangeRatesService = new ExchangeRatesService(exchangeRateRepository, eventRepository);
    const exchangeRatesController = new ExchangeRatesController(exchangeRatesService);
    const exchangeRatesRoutes = createExchangeRatesRoutes(exchangeRatesController);

    return exchangeRatesRoutes;
}

import { Router } from 'express';

import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IPaymentMethodRepository from '../../core/interfaces/repositories/IPaymentMethodRepository';

import PaymentMethodsController from './payment-methods.controller';
import createPaymentMethodsRoutes from './payment-methods.routes';
import PaymentMethodsService from './payment-methods.service';

export function createPaymentMethodsModule(
    paymentMethodRepository: IPaymentMethodRepository,
    eventRepository: IEventRepository,
): Router {
    const paymentMethodsService = new PaymentMethodsService(
        paymentMethodRepository,
        eventRepository,
    );
    const paymentMethodsController = new PaymentMethodsController(paymentMethodsService);
    const paymentMethodsRoutes = createPaymentMethodsRoutes(paymentMethodsController);

    return paymentMethodsRoutes;
}

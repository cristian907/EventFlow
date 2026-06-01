import {
    PaymentMethodType,
    PaymentMethodToCreateType,
    PaymentMethodToUpdateType,
} from '@eventflow/shared';

import { EventNotFoundError, PaymentMethodNotFoundError } from '../../core/errors/BusinessErrors';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IPaymentMethodRepository from '../../core/interfaces/repositories/IPaymentMethodRepository';

import PaymentMethodsMapper from './payment-methods.mapper';

export default class PaymentMethodsService {
    constructor(
        private paymentMethodRepository: IPaymentMethodRepository,
        private eventRepository: IEventRepository,
    ) {}

    public async list(eventId: string): Promise<PaymentMethodType[]> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const methods = await this.paymentMethodRepository.findByEventId(eventId);
        return methods.map(PaymentMethodsMapper.toPaymentMethodType);
    }

    public async create(
        eventId: string,
        data: PaymentMethodToCreateType,
    ): Promise<PaymentMethodType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);

        const created = await this.paymentMethodRepository.create({
            eventId,
            name: data.name,
            details: data.details,
            currency: data.currency,
        });
        return PaymentMethodsMapper.toPaymentMethodType(created);
    }

    public async update(
        eventId: string,
        methodId: string,
        data: PaymentMethodToUpdateType,
    ): Promise<PaymentMethodType> {
        const existing = await this.paymentMethodRepository.findById(methodId);
        if (!existing || existing.eventId !== eventId) {
            throw new PaymentMethodNotFoundError(methodId);
        }

        const updated = await this.paymentMethodRepository.update(methodId, {
            name: data.name,
            details: data.details,
            currency: data.currency,
            isActive: data.isActive,
        });
        return PaymentMethodsMapper.toPaymentMethodType(updated);
    }

    public async disable(eventId: string, methodId: string): Promise<PaymentMethodType> {
        const existing = await this.paymentMethodRepository.findById(methodId);
        if (!existing || existing.eventId !== eventId) {
            throw new PaymentMethodNotFoundError(methodId);
        }

        const updated = await this.paymentMethodRepository.update(methodId, { isActive: false });
        return PaymentMethodsMapper.toPaymentMethodType(updated);
    }
}

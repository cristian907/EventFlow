import { SaleToCreateType, sumPaymentsInUSD } from '@eventflow/shared';
import { OrderDetailType, ListOrdersResponse } from '@eventflow/shared';

import {
    InsufficientPaymentError,
    InsufficientTicketsError,
    NoActiveExchangeRateError,
    OrderNotFoundError,
    TicketTypeNotFoundError,
    TicketTypeNotSellableError,
} from '../../core/errors/BusinessErrors';
import ITransactionManager from '../../core/interfaces/ITransactionManager';
import ICustomerRepository from '../../core/interfaces/repositories/ICustomerRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import IOrderRepository, {
    OrderFilters,
} from '../../core/interfaces/repositories/IOrderRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import SalesMapper from './sales.mapper';

export default class SalesService {
    constructor(
        private readonly txManager: ITransactionManager,
        private readonly orderRepository: IOrderRepository,
        private readonly customerRepository: ICustomerRepository,
        private readonly ticketTypeRepository: ITicketTypeRepository,
        private readonly exchangeRateRepository: IExchangeRateRepository,
    ) {}

    async createSale(
        eventId: string,
        soldById: string,
        data: SaleToCreateType,
    ): Promise<OrderDetailType> {
        const rate = await this.exchangeRateRepository.findCurrentByEventId(eventId);
        if (!rate) throw new NoActiveExchangeRateError();

        const ticketType = await this.ticketTypeRepository.findById(data.ticketTypeId);
        if (!ticketType || ticketType.eventId !== eventId) {
            throw new TicketTypeNotFoundError(data.ticketTypeId);
        }
        if (!ticketType.isActive) {
            throw new TicketTypeNotSellableError('el tipo de entrada no está activo');
        }
        const now = new Date();
        if (ticketType.saleStartsAt && now < ticketType.saleStartsAt) {
            throw new TicketTypeNotSellableError('la venta aún no ha comenzado');
        }
        if (ticketType.saleEndsAt && now > ticketType.saleEndsAt) {
            throw new TicketTypeNotSellableError('el período de venta ha finalizado');
        }

        const unitPriceUSD =
            ticketType.currency === 'VES' ? ticketType.price / rate.rate : ticketType.price;
        const totalAmount = unitPriceUSD * data.quantity;

        const paidUSD = sumPaymentsInUSD(
            data.payments.map((p) => ({
                amount: p.amount,
                currency: p.currency as 'USD' | 'VES' | 'EUR',
            })),
            rate.rate,
        );
        if (paidUSD < totalAmount) throw new InsufficientPaymentError(totalAmount, paidUSD);

        const order = await this.txManager.runInTransaction(async (tx) => {
            const customer = await this.customerRepository.upsertByIdNumber(data.customer, tx);

            const decremented = await this.ticketTypeRepository.decrementSoldQuantityAtomic(
                data.ticketTypeId,
                data.quantity,
                tx,
            );
            if (!decremented) throw new InsufficientTicketsError();

            return this.orderRepository.create(
                {
                    eventId,
                    customerId: customer.id,
                    soldById,
                    exchangeRateId: rate.id,
                    totalAmount,
                    ticketTypeId: data.ticketTypeId,
                    quantity: data.quantity,
                    unitPrice: unitPriceUSD,
                    itemCurrency: 'USD',
                    subtotal: totalAmount,
                    payments: data.payments.map((p) => ({
                        paymentMethodId: p.paymentMethodId,
                        amount: p.amount,
                        currency: p.currency,
                        reference: p.reference,
                        receiptUrl: p.receiptUrl,
                        verifiedById: soldById,
                    })),
                },
                tx,
            );
        });

        // TODO: emit tickets (issue de Generación de Tickets)

        return SalesMapper.toOrderDetail(order);
    }

    async listOrders(eventId: string, filters: OrderFilters): Promise<ListOrdersResponse> {
        const { orders, total } = await this.orderRepository.findAndCount(eventId, filters);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        return {
            orders: orders.map(SalesMapper.toOrderSummary),
            total,
            page,
            limit,
        };
    }

    async getOrderDetail(eventId: string, orderId: string): Promise<OrderDetailType> {
        const order = await this.orderRepository.findById(eventId, orderId);
        if (!order) throw new OrderNotFoundError(orderId);
        return SalesMapper.toOrderDetail(order);
    }
}

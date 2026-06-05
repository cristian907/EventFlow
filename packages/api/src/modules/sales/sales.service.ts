import {
    SaleToCreateType,
    sumPaymentsInDivisa,
    OrderDetailType,
    ListOrdersResponse,
} from '@eventflow/shared';

import {
    InsufficientPaymentError,
    InsufficientTicketsError,
    NoActiveExchangeRateError,
    OrderNotFoundError,
    TicketTypeNotFoundError,
    TicketTypeNotSellableError,
    EventNotActiveError,
    EventNotFoundError,
} from '../../core/errors/BusinessErrors';
import ITransactionManager from '../../core/interfaces/ITransactionManager';
import IBcvRateRepository from '../../core/interfaces/repositories/IBcvRateRepository';
import ICustomerRepository from '../../core/interfaces/repositories/ICustomerRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import IOrderRepository, {
    OrderFilters,
} from '../../core/interfaces/repositories/IOrderRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';
import TicketsService from '../tickets/tickets.service';

import SalesMapper from './sales.mapper';

function convertFromDivisa(
    amountDivisa: number,
    targetCurrency: 'USD' | 'VES' | 'EUR',
    baseCurrency: 'USD' | 'EUR',
    activeRate: number,
    eurRate: number,
    usdRate: number,
): number {
    if (targetCurrency === baseCurrency) {
        return amountDivisa;
    }
    if (targetCurrency === 'VES') {
        return amountDivisa * activeRate;
    }
    const targetRate = targetCurrency === 'EUR' ? eurRate : usdRate;
    if (targetRate === 0) return 0;
    return (amountDivisa * activeRate) / targetRate;
}

export default class SalesService {
    constructor(
        private readonly txManager: ITransactionManager,
        private readonly orderRepository: IOrderRepository,
        private readonly customerRepository: ICustomerRepository,
        private readonly ticketTypeRepository: ITicketTypeRepository,
        private readonly exchangeRateRepository: IExchangeRateRepository,
        private readonly ticketsService: TicketsService,
        private readonly bcvRateRepository: IBcvRateRepository,
        private readonly eventRepository: IEventRepository,
    ) {}

    async createSale(
        eventId: string,
        soldById: string,
        data: SaleToCreateType,
    ): Promise<OrderDetailType> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) throw new EventNotFoundError(eventId);
        if (event.status !== 'ACTIVE') {
            throw new EventNotActiveError(event.status);
        }

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

        const baseCurrency = event.rateSource === 'EUR_BCV' ? 'EUR' : 'USD';
        const event = await this.eventRepository.findById(eventId);

        const unitPriceDivisa = ticketType.usdPrice;
        const totalAmountDivisa = unitPriceDivisa * data.quantity;

        const latestBcv = await this.bcvRateRepository.findLatest();
        const activeRateNum = Number(rate.rate);

        let eurRateNum: number;
        let usdRateNum: number;

        if (latestBcv) {
            eurRateNum = Number(latestBcv.eurRate);
            usdRateNum = Number(latestBcv.usdRate);
        } else {
            if (event.rateSource === 'EUR_BCV') {
                eurRateNum = activeRateNum;
                usdRateNum = activeRateNum / 1.08;
            } else {
                usdRateNum = activeRateNum;
                eurRateNum = activeRateNum * 1.08;
            }
        }

        const paidDivisa = sumPaymentsInDivisa(
            data.payments.map((p) => ({
                amount: p.amount,
                currency: p.currency as 'USD' | 'VES' | 'EUR',
            })),
            baseCurrency,
            activeRateNum,
            eurRateNum,
            usdRateNum,
        );
        if (paidDivisa < totalAmountDivisa)
            throw new InsufficientPaymentError(totalAmountDivisa, paidDivisa);

        const paymentsToRecord = data.payments.map((p) => ({
            paymentMethodId: p.paymentMethodId,
            amount: p.amount,
            currency: p.currency,
            reference: p.reference,
            receiptUrl: p.receiptUrl,
            verifiedById: soldById,
        }));

        if (paymentsToRecord.length > 0) {
            const lastIndex = paymentsToRecord.length - 1;
            const lastPayment = paymentsToRecord[lastIndex];

            const sumPriorPaymentsDivisa = sumPaymentsInDivisa(
                paymentsToRecord.slice(0, -1).map((p) => ({
                    amount: p.amount,
                    currency: p.currency as 'USD' | 'VES' | 'EUR',
                })),
                baseCurrency,
                activeRateNum,
                eurRateNum,
                usdRateNum,
            );

            const neededLastPaymentDivisa = Math.max(0, totalAmountDivisa - sumPriorPaymentsDivisa);

            const adjustedAmount = convertFromDivisa(
                neededLastPaymentDivisa,
                lastPayment.currency as 'USD' | 'VES' | 'EUR',
                baseCurrency,
                activeRateNum,
                eurRateNum,
                usdRateNum,
            );

            lastPayment.amount = Number(adjustedAmount.toFixed(2));
        }

        const order = await this.txManager.runInTransaction(async (tx) => {
            const customer = await this.customerRepository.upsertByIdNumber(data.customer, tx);

            const decremented = await this.ticketTypeRepository.decrementSoldQuantityAtomic(
                data.ticketTypeId,
                data.quantity,
                tx,
            );
            if (!decremented) throw new InsufficientTicketsError();

            const createdOrder = await this.orderRepository.create(
                {
                    eventId,
                    customerId: customer.id,
                    soldById,
                    exchangeRateId: rate.id,
                    totalAmount: totalAmountDivisa,
                    ticketTypeId: data.ticketTypeId,
                    quantity: data.quantity,
                    unitPrice: unitPriceDivisa,
                    itemCurrency: baseCurrency,
                    subtotal: totalAmountDivisa,
                    payments: paymentsToRecord,
                },
                tx,
            );

            await this.ticketsService.emitTicketsForOrder(
                eventId,
                createdOrder.id,
                customer.id,
                (createdOrder.items ?? []).map((item) => ({
                    orderItemId: item.id,
                    ticketTypeId: item.ticketTypeId,
                    quantity: item.quantity,
                })),
                tx,
            );

            return createdOrder;
        });

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

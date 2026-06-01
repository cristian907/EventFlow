import {
    OrderDetailType,
    OrderSummaryType,
    OrderItemSummaryType,
    PaymentSummaryType,
    OrderCustomerType,
    PaymentCurrency,
} from '@eventflow/shared';

import Order from '../../core/entities/Order';

export default class SalesMapper {
    static toOrderSummary(order: Order): OrderSummaryType {
        const item = order.items?.[0];
        const paymentMethods = [...new Set((order.payments ?? []).map((p) => p.paymentMethodName))];

        return {
            id: order.id,
            eventId: order.eventId,
            customer: {
                id: order.customer?.id ?? '',
                idNumber: order.customer?.idNumber ?? '',
                fullName: order.customer?.fullName ?? '',
                phone: order.customer?.phone ?? undefined,
                email: order.customer?.email ?? undefined,
            },
            item: item
                ? {
                      id: item.id,
                      ticketTypeId: item.ticketTypeId,
                      ticketTypeName: item.ticketTypeName,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      currency: item.currency,
                      subtotal: item.subtotal,
                  }
                : {
                      id: '',
                      ticketTypeId: '',
                      ticketTypeName: '',
                      quantity: 0,
                      unitPrice: 0,
                      currency: 'USD',
                      subtotal: 0,
                  },
            totalAmount: order.totalAmount,
            currency: order.currency,
            soldByName: order.soldByName,
            paymentMethods,
            createdAt: order.createdAt.toISOString(),
        };
    }

    static toOrderDetail(order: Order): OrderDetailType {
        const customer: OrderCustomerType = {
            id: order.customer?.id ?? '',
            idNumber: order.customer?.idNumber ?? '',
            fullName: order.customer?.fullName ?? '',
            phone: order.customer?.phone ?? undefined,
            email: order.customer?.email ?? undefined,
        };

        const items: OrderItemSummaryType[] = (order.items ?? []).map((i) => ({
            id: i.id,
            ticketTypeId: i.ticketTypeId,
            ticketTypeName: i.ticketTypeName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            currency: i.currency,
            subtotal: i.subtotal,
        }));

        const payments: PaymentSummaryType[] = (order.payments ?? []).map((p) => ({
            id: p.id,
            paymentMethodId: p.paymentMethodId,
            paymentMethodName: p.paymentMethodName,
            amount: p.amount,
            currency: p.currency as PaymentCurrency,
            reference: p.reference ?? undefined,
            receiptUrl: p.receiptUrl ?? undefined,
            status: p.status,
            verifiedAt: p.verifiedAt.toISOString(),
        }));

        return {
            id: order.id,
            eventId: order.eventId,
            customer,
            items,
            payments,
            totalAmount: order.totalAmount,
            currency: order.currency,
            exchangeRate: order.exchangeRate,
            soldByName: order.soldByName,
            createdAt: order.createdAt.toISOString(),
        };
    }
}

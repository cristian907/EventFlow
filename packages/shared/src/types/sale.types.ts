import { z } from 'zod';

import { SaleToCreateSchema } from '../schemas/sale.schemas';

export type SaleToCreateType = z.infer<typeof SaleToCreateSchema>;

export type PaymentCurrency = 'USD' | 'VES' | 'EUR';

export interface PaymentSummaryType {
    id: string;
    paymentMethodId: string;
    paymentMethodName: string;
    amount: number;
    currency: PaymentCurrency;
    reference?: string;
    receiptUrl?: string;
    status: string;
    verifiedAt: string;
}

export interface OrderItemSummaryType {
    id: string;
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    subtotal: number;
}

export interface OrderCustomerType {
    id: string;
    idNumber: string;
    fullName: string;
    phone?: string;
    email?: string;
}

export interface OrderSummaryType {
    id: string;
    eventId: string;
    customer: OrderCustomerType;
    item: OrderItemSummaryType;
    totalAmount: number;
    currency: string;
    soldByName: string;
    paymentMethods: string[];
    createdAt: string;
}

export interface OrderDetailType {
    id: string;
    eventId: string;
    customer: OrderCustomerType;
    items: OrderItemSummaryType[];
    payments: PaymentSummaryType[];
    totalAmount: number;
    currency: string;
    exchangeRate: number;
    soldByName: string;
    createdAt: string;
}

export interface ListOrdersResponse {
    orders: OrderSummaryType[];
    total: number;
    page: number;
    limit: number;
}

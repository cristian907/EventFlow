import { EventStatus } from './event.types';

export const SSE_EVENTS = {
    CHECK_IN: 'check-in',
} as const;

export type SseEventType = (typeof SSE_EVENTS)[keyof typeof SSE_EVENTS];

export interface CheckInEvent {
    ticketId: string;
    ticketTypeName: string;
    customerName: string;
    usedAt: string;
    newTotalAttendance: number;
}

export interface EventDashboardHeader {
    name: string;
    status: EventStatus;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    address: string;
    maxCapacity: number;
}

export interface SalesByTicketType {
    ticketTypeId: string;
    ticketTypeName: string;
    revenueUSD: number;
    quantitySold: number;
}

export interface SalesByPaymentMethod {
    paymentMethodId: string;
    paymentMethodName: string;
    currency: string;
    originalAmount: number;
    usdEquivalent: number;
}

export interface SalesByCurrency {
    currency: string;
    originalAmount: number;
    usdEquivalent: number;
}

export interface SalesBySeller {
    sellerId: string;
    sellerName: string;
    revenueUSD: number;
    quantitySold: number;
}

export interface SalesOverTime {
    timeGroup: string;
    revenueUSD: number;
    quantitySold: number;
}

export interface EventDashboardSales {
    totalRevenueUSD: number;
    totalOrdersCount: number;
    averageTicketUSD: number;
    salesByTicketType: SalesByTicketType[];
    salesByPaymentMethod: SalesByPaymentMethod[];
    salesByCurrency: SalesByCurrency[];
    salesBySeller: SalesBySeller[];
    salesOverTime: SalesOverTime[];
}

export interface TicketTypeInventorySummary {
    ticketTypeId: string;
    ticketTypeName: string;
    price: number;
    currency: string;
    totalQuantity: number;
    soldQuantity: number;
    availableQuantity: number;
    soldPercentage: number;
    isSoldOut: boolean;
}

export interface EventDashboardInventory {
    byTicketType: TicketTypeInventorySummary[];
    totalTicketsSold: number;
    totalTicketsCapacity: number;
    occupationPercentage: number;
    soldOutTicketTypesCount: number;
}

export interface CheckinsOverTime {
    timeGroup: string;
    count: number;
}

export interface EventDashboardAttendance {
    usedTicketsCount: number;
    totalIssuedTicketsCount: number;
    attendancePercentage: number;
    missingAttendanceCount: number;
    failedAttemptsCount: {
        alreadyUsed: number;
        invalid: number;
    };
    checkinsOverTime: CheckinsOverTime[];
}

export interface EventDashboardSummary {
    header: EventDashboardHeader;
    sales: EventDashboardSales;
    inventory: EventDashboardInventory;
    attendance: EventDashboardAttendance;
}

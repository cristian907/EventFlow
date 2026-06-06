import {
    EventDashboardSummary,
    EventStatus,
    TicketTypeInventorySummary,
    SalesByTicketType,
    SalesBySeller,
    SalesOverTime,
    SalesByPaymentMethod,
    SalesByCurrency,
    CheckinsOverTime,
    GlobalDashboardSummary,
    GlobalDashboardQuery,
    GlobalDashboardKpis,
    GlobalEventSummary,
} from '@eventflow/shared';

import IDashboardRepository from '../../core/interfaces/repositories/IDashboardRepository';
import { PrismaClient, Prisma } from '../../generated/prisma/client';

export default class PrismaDashboardRepository implements IDashboardRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async getSummary(eventId: string): Promise<EventDashboardSummary> {
        // 1. Fetch Event Header info
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            throw new Error(`Event with ID ${eventId} not found`);
        }

        const header = {
            name: event.name,
            status: event.status as EventStatus,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            location: event.location,
            address: event.address,
            maxCapacity: event.maxCapacity,
        };

        // 2. Get latest BCV rate for EUR ratio conversions (used to convert EUR orders/payments to USD)
        const latestBcv = await this.prisma.bcvRate.findFirst({
            orderBy: { scrapedAt: 'desc' },
        });
        const bcvEurRate = latestBcv?.eurRate ? Number(latestBcv.eurRate) : 38;
        const bcvUsdRate = latestBcv?.usdRate ? Number(latestBcv.usdRate) : 36;
        const eurUsdRatio = bcvUsdRate > 0 ? bcvEurRate / bcvUsdRate : 1.08;

        // 3. Fetch all orders with items and sellers for Sales computations
        const orders = await this.prisma.order.findMany({
            where: { eventId },
            select: {
                id: true,
                totalAmount: true,
                currency: true,
                soldById: true,
                soldBy: { select: { fullName: true } },
                createdAt: true,
                items: {
                    select: {
                        quantity: true,
                        ticketTypeId: true,
                        ticketType: { select: { name: true } },
                        subtotal: true,
                        currency: true,
                    },
                },
            },
        });

        // Compute base sales metrics
        const totalOrdersCount = orders.length;
        let totalRevenueUSD = 0;
        const ticketTypeMap = new Map<
            string,
            { name: string; revenue: number; quantity: number }
        >();
        const sellerMap = new Map<string, { name: string; revenue: number; quantity: number }>();
        const salesTimeMap = new Map<string, { revenue: number; quantity: number }>();

        // We check event duration to choose hourly or daily time series groupings
        const durationMs = event.endDate.getTime() - event.startDate.getTime();
        const useHourly = durationMs <= 3 * 24 * 60 * 60 * 1000; // <= 3 days

        for (const order of orders) {
            const isEur = order.currency === 'EUR';
            const orderTotal = Number(order.totalAmount);
            const orderTotalUSD = isEur ? orderTotal * eurUsdRatio : orderTotal;
            totalRevenueUSD += orderTotalUSD;

            // Group by Seller
            const sellerId = order.soldById;
            const sellerName = order.soldBy?.fullName || 'Vendedor Desconocido';
            const prevSeller = sellerMap.get(sellerId) || {
                name: sellerName,
                revenue: 0,
                quantity: 0,
            };
            prevSeller.revenue += orderTotalUSD;

            let orderQuantity = 0;
            // Group by Ticket Type
            for (const item of order.items) {
                const typeId = item.ticketTypeId;
                const typeName = item.ticketType?.name || 'Entrada Desconocida';
                const itemSubtotal = Number(item.subtotal);
                const itemSubtotalUSD =
                    item.currency === 'EUR' ? itemSubtotal * eurUsdRatio : itemSubtotal;
                const itemQty = item.quantity;
                orderQuantity += itemQty;

                const prevType = ticketTypeMap.get(typeId) || {
                    name: typeName,
                    revenue: 0,
                    quantity: 0,
                };
                prevType.revenue += itemSubtotalUSD;
                prevType.quantity += itemQty;
                ticketTypeMap.set(typeId, prevType);
            }

            prevSeller.quantity += orderQuantity;
            sellerMap.set(sellerId, prevSeller);

            // Group by Time series
            const date = new Date(order.createdAt);
            let timeKey: string;
            if (useHourly) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                const hh = String(date.getHours()).padStart(2, '0');
                timeKey = `${yyyy}-${mm}-${dd} ${hh}:00`;
            } else {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                timeKey = `${yyyy}-${mm}-${dd}`;
            }

            const prevTime = salesTimeMap.get(timeKey) || { revenue: 0, quantity: 0 };
            prevTime.revenue += orderTotalUSD;
            prevTime.quantity += orderQuantity;
            salesTimeMap.set(timeKey, prevTime);
        }

        const averageTicketUSD = totalOrdersCount > 0 ? totalRevenueUSD / totalOrdersCount : 0;

        const salesByTicketType: SalesByTicketType[] = Array.from(ticketTypeMap.entries()).map(
            ([id, val]) => ({
                ticketTypeId: id,
                ticketTypeName: val.name,
                revenueUSD: Number(val.revenue.toFixed(2)),
                quantitySold: val.quantity,
            }),
        );

        const salesBySeller: SalesBySeller[] = Array.from(sellerMap.entries())
            .map(([id, val]) => ({
                sellerId: id,
                sellerName: val.name,
                revenueUSD: Number(val.revenue.toFixed(2)),
                quantitySold: val.quantity,
            }))
            .sort((a, b) => b.revenueUSD - a.revenueUSD);

        const salesOverTime: SalesOverTime[] = Array.from(salesTimeMap.entries())
            .map(([timeGroup, val]) => ({
                timeGroup,
                revenueUSD: Number(val.revenue.toFixed(2)),
                quantitySold: val.quantity,
            }))
            .sort((a, b) => a.timeGroup.localeCompare(b.timeGroup));

        // Fetch payments for breakdowns
        const payments = await this.prisma.payment.findMany({
            where: { order: { eventId } },
            select: {
                id: true,
                paymentMethodId: true,
                paymentMethod: { select: { name: true } },
                amount: true,
                currency: true,
                orderId: true,
                order: {
                    select: {
                        id: true,
                        totalAmount: true,
                        currency: true,
                        exchangeRate: { select: { rate: true } },
                    },
                },
            },
        });

        // Group payments by orderId
        const paymentsByOrder = new Map<string, typeof payments>();
        for (const p of payments) {
            const list = paymentsByOrder.get(p.orderId) || [];
            list.push(p);
            paymentsByOrder.set(p.orderId, list);
        }

        const adjustedPayments: Array<{
            paymentMethodId: string;
            paymentMethodName: string;
            currency: string;
            amount: number;
            usdEquivalent: number;
        }> = [];

        for (const [, orderPayments] of paymentsByOrder.entries()) {
            const order = orderPayments[0].order;
            const isEur = order.currency === 'EUR';
            const orderTotal = Number(order.totalAmount);
            const orderTotalUSD = isEur ? orderTotal * eurUsdRatio : orderTotal;

            // Compute raw USD equivalents first for this order
            const parsedPayments = orderPayments.map((p) => {
                const amount = Number(p.amount);
                const currency = p.currency;
                let usdEquivalent = amount;

                if (currency === 'VES') {
                    const rate = p.order?.exchangeRate?.rate
                        ? Number(p.order.exchangeRate.rate)
                        : 1;
                    usdEquivalent = rate > 0 ? amount / rate : 0;
                } else if (currency === 'EUR') {
                    usdEquivalent = amount * eurUsdRatio;
                }

                return {
                    paymentMethodId: p.paymentMethodId,
                    paymentMethodName: p.paymentMethod?.name || 'Método Desconocido',
                    currency,
                    amount,
                    usdEquivalent,
                };
            });

            const totalPaymentsUsd = parsedPayments.reduce((sum, p) => sum + p.usdEquivalent, 0);

            // If payments exceed orderTotalUSD, scale them down to reflect change given back
            if (totalPaymentsUsd > orderTotalUSD && totalPaymentsUsd > 0) {
                const scale = orderTotalUSD / totalPaymentsUsd;
                for (const p of parsedPayments) {
                    p.amount = p.amount * scale;
                    p.usdEquivalent = p.usdEquivalent * scale;
                }
            }

            adjustedPayments.push(...parsedPayments);
        }

        const methodMap = new Map<
            string,
            { name: string; currency: string; amount: number; usdEquivalent: number }
        >();
        const currencyMap = new Map<string, { amount: number; usdEquivalent: number }>();

        for (const p of adjustedPayments) {
            // Group by Method and currency
            const methodKey = `${p.paymentMethodId}-${p.currency}`;
            const prevMethod = methodMap.get(methodKey) || {
                name: p.paymentMethodName,
                currency: p.currency,
                amount: 0,
                usdEquivalent: 0,
            };
            prevMethod.amount += p.amount;
            prevMethod.usdEquivalent += p.usdEquivalent;
            methodMap.set(methodKey, prevMethod);

            // Group by currency
            const prevCurr = currencyMap.get(p.currency) || { amount: 0, usdEquivalent: 0 };
            prevCurr.amount += p.amount;
            prevCurr.usdEquivalent += p.usdEquivalent;
            currencyMap.set(p.currency, prevCurr);
        }

        const salesByPaymentMethod: SalesByPaymentMethod[] = Array.from(methodMap.entries()).map(
            ([key, val]) => {
                const [paymentMethodId] = key.split('-');
                return {
                    paymentMethodId,
                    paymentMethodName: val.name,
                    currency: val.currency,
                    originalAmount: Number(val.amount.toFixed(2)),
                    usdEquivalent: Number(val.usdEquivalent.toFixed(2)),
                };
            },
        );

        const salesByCurrency: SalesByCurrency[] = Array.from(currencyMap.entries()).map(
            ([currency, val]) => ({
                currency,
                originalAmount: Number(val.amount.toFixed(2)),
                usdEquivalent: Number(val.usdEquivalent.toFixed(2)),
            }),
        );

        const sales = {
            totalRevenueUSD: Number(totalRevenueUSD.toFixed(2)),
            totalOrdersCount,
            averageTicketUSD: Number(averageTicketUSD.toFixed(2)),
            salesByTicketType,
            salesByPaymentMethod,
            salesByCurrency,
            salesBySeller,
            salesOverTime,
        };

        // 3. Fetch Ticket Types for Inventory calculations
        const ticketTypes = await this.prisma.ticketType.findMany({
            where: { eventId },
        });

        let totalTicketsSold = 0;
        let soldOutTicketTypesCount = 0;

        const byTicketType: TicketTypeInventorySummary[] = ticketTypes.map((tt) => {
            const sold = tt.soldQuantity;
            const total = tt.totalQuantity;
            const available = Math.max(0, total - sold);
            const soldPct = total > 0 ? (sold / total) * 100 : 0;
            const isSoldOut = sold >= total;

            totalTicketsSold += sold;
            if (isSoldOut) {
                soldOutTicketTypesCount++;
            }

            return {
                ticketTypeId: tt.id,
                ticketTypeName: tt.name,
                price: tt.price,
                currency: tt.currency,
                totalQuantity: total,
                soldQuantity: sold,
                availableQuantity: available,
                soldPercentage: Number(soldPct.toFixed(2)),
                isSoldOut,
            };
        });

        const totalTicketsCapacity = event.maxCapacity;
        const occupationPercentage =
            totalTicketsCapacity > 0 ? (totalTicketsSold / totalTicketsCapacity) * 100 : 0;

        const inventory = {
            byTicketType,
            totalTicketsSold,
            totalTicketsCapacity,
            occupationPercentage: Number(occupationPercentage.toFixed(2)),
            soldOutTicketTypesCount,
        };

        // 4. Fetch Ticket status and Access logs for Attendance calculations
        const usedTicketsCount = await this.prisma.ticket.count({
            where: { eventId, status: 'USED' },
        });

        const totalIssuedTicketsCount = await this.prisma.ticket.count({
            where: { eventId, status: { in: ['VALID', 'USED'] } },
        });

        const attendancePercentage =
            totalIssuedTicketsCount > 0 ? (usedTicketsCount / totalIssuedTicketsCount) * 100 : 0;
        const missingAttendanceCount = Math.max(0, totalIssuedTicketsCount - usedTicketsCount);

        const failedAlreadyUsedCount = await this.prisma.accessLog.count({
            where: { eventId, result: 'ALREADY_USED' },
        });

        const failedInvalidCount = await this.prisma.accessLog.count({
            where: { eventId, result: 'INVALID' },
        });

        // Flow curve of entries (successful checks) over time
        const checkins = await this.prisma.accessLog.findMany({
            where: { eventId, result: 'VALID' },
            select: { scannedAt: true },
            orderBy: { scannedAt: 'asc' },
        });

        const checkinTimeMap = new Map<string, number>();
        for (const c of checkins) {
            const date = new Date(c.scannedAt);
            // bucket in 5-minute intervals
            const minutes = date.getMinutes();
            const bucketMinutes = Math.floor(minutes / 5) * 5;
            date.setMinutes(bucketMinutes, 0, 0);

            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const mmStr = String(bucketMinutes).padStart(2, '0');
            const key = `${yyyy}-${mm}-${dd} ${hh}:${mmStr}`;

            checkinTimeMap.set(key, (checkinTimeMap.get(key) || 0) + 1);
        }

        const checkinsOverTime: CheckinsOverTime[] = Array.from(checkinTimeMap.entries())
            .map(([timeGroup, count]) => ({
                timeGroup,
                count,
            }))
            .sort((a, b) => a.timeGroup.localeCompare(b.timeGroup));

        const attendance = {
            usedTicketsCount,
            totalIssuedTicketsCount,
            attendancePercentage: Number(attendancePercentage.toFixed(2)),
            missingAttendanceCount,
            failedAttemptsCount: {
                alreadyUsed: failedAlreadyUsedCount,
                invalid: failedInvalidCount,
            },
            checkinsOverTime,
        };

        return {
            header,
            sales,
            inventory,
            attendance,
        };
    }

    async getGlobalSummary(query: GlobalDashboardQuery): Promise<GlobalDashboardSummary> {
        // 1. Get BCV rates for EUR conversion
        const latestBcv = await this.prisma.bcvRate.findFirst({
            orderBy: { scrapedAt: 'desc' },
        });
        const bcvEurRate = latestBcv?.eurRate ? Number(latestBcv.eurRate) : 38;
        const bcvUsdRate = latestBcv?.usdRate ? Number(latestBcv.usdRate) : 36;
        const eurUsdRatio = bcvUsdRate > 0 ? bcvEurRate / bcvUsdRate : 1.08;

        // 2. Fetch event counts grouped by status
        const eventCounts = await this.prisma.event.groupBy({
            by: ['status'],
            _count: {
                id: true,
            },
        });

        let eventsCreatedCount = 0;
        let eventsActiveCount = 0;
        let eventsCancelledCount = 0;

        for (const ec of eventCounts) {
            eventsCreatedCount += ec._count.id;
            if (ec.status === 'ACTIVE') {
                eventsActiveCount = ec._count.id;
            } else if (ec.status === 'CANCELLED') {
                eventsCancelledCount = ec._count.id;
            }
        }

        // 3. Total tickets sold global
        const ticketTypesAggregation = await this.prisma.ticketType.aggregate({
            _sum: {
                soldQuantity: true,
            },
        });
        const totalTicketsSold = ticketTypesAggregation._sum.soldQuantity || 0;

        // 4. Global capacity (combined max capacity of all events)
        const eventsCapacityAggregation = await this.prisma.event.aggregate({
            _sum: {
                maxCapacity: true,
            },
        });
        const globalCapacity = eventsCapacityAggregation._sum.maxCapacity || 0;
        const globalOccupationPercentage =
            globalCapacity > 0 ? (totalTicketsSold / globalCapacity) * 100 : 0;

        // 5. Total revenue in USD across the entire platform
        const orderGroups = await this.prisma.order.groupBy({
            by: ['currency'],
            _sum: {
                totalAmount: true,
            },
        });

        let totalRevenueUSD = 0;
        for (const og of orderGroups) {
            const amount = og._sum.totalAmount ? Number(og._sum.totalAmount) : 0;
            if (og.currency === 'EUR') {
                totalRevenueUSD += amount * eurUsdRatio;
            } else {
                totalRevenueUSD += amount;
            }
        }

        // 6. Global Attendance
        const usedTicketsCount = await this.prisma.ticket.count({
            where: { status: 'USED' },
        });
        const totalIssuedTicketsCount = await this.prisma.ticket.count({
            where: { status: { in: ['VALID', 'USED'] } },
        });
        const globalAttendancePercentage =
            totalIssuedTicketsCount > 0 ? (usedTicketsCount / totalIssuedTicketsCount) * 100 : 0;

        const kpis: GlobalDashboardKpis = {
            totalRevenueUSD: Number(totalRevenueUSD.toFixed(2)),
            totalTicketsSold,
            globalOccupationPercentage: Number(globalOccupationPercentage.toFixed(2)),
            globalAttendancePercentage: Number(globalAttendancePercentage.toFixed(2)),
            eventsCreatedCount,
            eventsActiveCount,
            eventsCancelledCount,
        };

        // 7. Get filtered list of ALL events
        const whereClause: Prisma.EventWhereInput = {};
        if (query.status) {
            whereClause.status = query.status;
        }
        if (query.search) {
            whereClause.name = {
                contains: query.search,
                mode: 'insensitive',
            };
        }

        const allEvents = await this.prisma.event.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                status: true,
                maxCapacity: true,
            },
        });

        const eventIds = allEvents.map((e) => e.id);

        if (eventIds.length === 0) {
            return {
                kpis,
                eventSummaries: {
                    items: [],
                    total: 0,
                    page: query.page || 1,
                    limit: query.limit || 10,
                    totalPages: 0,
                },
            };
        }

        // Fetch Order sums grouped by eventId and currency for these events
        const eventOrderSums = await this.prisma.order.groupBy({
            by: ['eventId', 'currency'],
            where: {
                eventId: { in: eventIds },
            },
            _sum: {
                totalAmount: true,
            },
        });

        // Fetch Tickets sold grouped by eventId for these events
        const eventTicketTypeSums = await this.prisma.ticketType.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: eventIds },
            },
            _sum: {
                soldQuantity: true,
            },
        });

        // Fetch Ticket status counts grouped by eventId and status for these events
        const eventTicketCounts = await this.prisma.ticket.groupBy({
            by: ['eventId', 'status'],
            where: {
                eventId: { in: eventIds },
            },
            _count: {
                id: true,
            },
        });

        // Build mapping lookup structures
        const revenueMap = new Map<string, number>();
        for (const eos of eventOrderSums) {
            const amount = eos._sum.totalAmount ? Number(eos._sum.totalAmount) : 0;
            const usdVal = eos.currency === 'EUR' ? amount * eurUsdRatio : amount;
            revenueMap.set(eos.eventId, (revenueMap.get(eos.eventId) || 0) + usdVal);
        }

        const soldMap = new Map<string, number>();
        for (const tts of eventTicketTypeSums) {
            const sold = tts._sum.soldQuantity || 0;
            soldMap.set(tts.eventId, sold);
        }

        const ticketCountsMap = new Map<string, { used: number; total: number }>();
        for (const tc of eventTicketCounts) {
            const current = ticketCountsMap.get(tc.eventId) || { used: 0, total: 0 };
            const count = tc._count.id;
            if (tc.status === 'USED') {
                current.used += count;
            }
            if (tc.status === 'VALID' || tc.status === 'USED') {
                current.total += count;
            }
            ticketCountsMap.set(tc.eventId, current);
        }

        // Map events to summary DTOs
        const eventSummariesMapped: GlobalEventSummary[] = allEvents.map((e) => {
            const rev = revenueMap.get(e.id) || 0;
            const sold = soldMap.get(e.id) || 0;
            const tc = ticketCountsMap.get(e.id) || { used: 0, total: 0 };
            const attendancePct = tc.total > 0 ? (tc.used / tc.total) * 100 : 0;

            return {
                id: e.id,
                name: e.name,
                status: e.status as EventStatus,
                revenueUSD: Number(rev.toFixed(2)),
                ticketsSold: sold,
                capacity: e.maxCapacity,
                attendancePercentage: Number(attendancePct.toFixed(2)),
            };
        });

        // Apply Sorting
        if (query.sortBy) {
            const orderMultiplier = query.sortOrder === 'asc' ? 1 : -1;
            eventSummariesMapped.sort((a, b) => {
                let valA = 0;
                let valB = 0;

                if (query.sortBy === 'revenue') {
                    valA = a.revenueUSD;
                    valB = b.revenueUSD;
                } else if (query.sortBy === 'occupancy') {
                    valA = a.capacity > 0 ? a.ticketsSold / a.capacity : 0;
                    valB = b.capacity > 0 ? b.ticketsSold / b.capacity : 0;
                } else if (query.sortBy === 'attendance') {
                    valA = a.attendancePercentage;
                    valB = b.attendancePercentage;
                }

                if (valA < valB) return -1 * orderMultiplier;
                if (valA > valB) return 1 * orderMultiplier;
                return 0;
            });
        } else {
            // Default sort: name
            eventSummariesMapped.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Apply Pagination
        const total = eventSummariesMapped.length;
        const page = query.page || 1;
        const limit = query.limit || 10;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedItems = eventSummariesMapped.slice(offset, offset + limit);

        return {
            kpis,
            eventSummaries: {
                items: paginatedItems,
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}

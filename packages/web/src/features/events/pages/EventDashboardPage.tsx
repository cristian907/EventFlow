import { EventDashboardSummary, CheckInEvent, SSE_EVENTS } from '@eventflow/shared';
import {
    faUsers,
    faCalendarAlt,
    faClock,
    faMapMarkerAlt,
    faDollarSign,
    faExclamationTriangle,
    faSync,
    faTrophy,
    faCoins,
    faQrcode,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { dashboardService } from '../services/dashboardService';

// Live Notification Toast structure
interface ToastInfo {
    id: string;
    customerName: string;
    ticketTypeName: string;
    timestamp: string;
}

export function EventDashboardPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { currentEvent } = useEvent();

    const [summary, setSummary] = useState<EventDashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Live stream status and toasts
    const [sseStatus, setSseStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
    const [toasts, setToasts] = useState<ToastInfo[]>([]);

    // Countdown remaining time state
    const [timeRemainingText, setTimeRemainingText] = useState<string>('');

    // Fetch initial aggregate KPIs
    const fetchSummary = async (showRefreshIndicator = false) => {
        if (!eventId) return;
        if (showRefreshIndicator) setIsRefreshing(true);
        else setIsLoading(true);

        setError(null);
        try {
            const data = await dashboardService.getSummary(eventId);
            setSummary(data);
        } catch (err: unknown) {
            console.error('Error fetching dashboard summary:', err);
            setError('No se pudieron cargar las métricas consolidadas del evento.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Periodic countdown refresh and initial load
    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchSummary();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // SSE Stream setup
    useEffect(() => {
        if (!eventId) return;

        const sseTimer = setTimeout(() => {
            setSseStatus('connecting');
        }, 0);

        // Connect to same-origin SSE stream. Credentials travel automatically.
        const streamUrl = `/api/events/${eventId}/dashboard/stream`;
        const eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
            setSseStatus('connected');
        };

        eventSource.onerror = (e) => {
            console.error('SSE Stream Error:', e);
            setSseStatus('error');
        };

        // Listen for new check-in events
        eventSource.addEventListener(SSE_EVENTS.CHECK_IN, (e) => {
            try {
                const eventData = JSON.parse(e.data) as CheckInEvent;

                // Add toast notification
                const newToast: ToastInfo = {
                    id: Math.random().toString(36).substring(2, 9),
                    customerName: eventData.customerName,
                    ticketTypeName: eventData.ticketTypeName,
                    timestamp: new Date(eventData.usedAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                };
                setToasts((prev) => [newToast, ...prev].slice(0, 3)); // Keep last 3 toasts

                // Auto-remove toast after 4 seconds
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
                }, 4000);

                // Update metrics in real time
                setSummary((prevSummary) => {
                    if (!prevSummary) return null;

                    const updatedUsedTicketsCount = eventData.newTotalAttendance;
                    const totalIssued = prevSummary.attendance.totalIssuedTicketsCount;
                    const newAttendancePct =
                        totalIssued > 0 ? (updatedUsedTicketsCount / totalIssued) * 100 : 0;
                    const newMissingCount = Math.max(0, totalIssued - updatedUsedTicketsCount);

                    // Add point to time-series
                    const date = new Date(eventData.usedAt);
                    const minutes = date.getMinutes();
                    const bucketMinutes = Math.floor(minutes / 5) * 5;
                    date.setMinutes(bucketMinutes, 0, 0);
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mmStr = String(bucketMinutes).padStart(2, '0');
                    const timeGroup = `${yyyy}-${mm}-${dd} ${hh}:${mmStr}`;

                    const checkinsOverTime = [...prevSummary.attendance.checkinsOverTime];
                    const existingIndex = checkinsOverTime.findIndex(
                        (c) => c.timeGroup === timeGroup,
                    );
                    if (existingIndex !== -1) {
                        checkinsOverTime[existingIndex] = {
                            ...checkinsOverTime[existingIndex],
                            count: checkinsOverTime[existingIndex].count + 1,
                        };
                    } else {
                        checkinsOverTime.push({ timeGroup, count: 1 });
                        checkinsOverTime.sort((a, b) => a.timeGroup.localeCompare(b.timeGroup));
                    }

                    return {
                        ...prevSummary,
                        attendance: {
                            ...prevSummary.attendance,
                            usedTicketsCount: updatedUsedTicketsCount,
                            attendancePercentage: Number(newAttendancePct.toFixed(2)),
                            missingAttendanceCount: newMissingCount,
                            checkinsOverTime,
                        },
                    };
                });
            } catch (err) {
                console.error('Error parsing SSE check-in event:', err);
            }
        });

        // Clean up when client disconnects
        return () => {
            clearTimeout(sseTimer);
            eventSource.close();
        };
    }, [eventId]);

    // Live Event countdown logic
    useEffect(() => {
        if (!currentEvent) return;

        const updateCountdown = () => {
            const now = new Date();
            const start = new Date(currentEvent.startDate);
            const end = new Date(currentEvent.endDate);

            if (currentEvent.status === 'DRAFT') {
                setTimeRemainingText('Borrador (Sin iniciar)');
                return;
            }

            if (currentEvent.status === 'CANCELLED') {
                setTimeRemainingText('Evento Cancelado');
                return;
            }

            if (now < start) {
                // Not started yet
                const diffMs = start.getTime() - now.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                if (diffDays > 0) {
                    setTimeRemainingText(`Inicia en ${diffDays}d ${diffHours}h`);
                } else {
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeRemainingText(`Inicia en ${diffHours}h ${diffMins}m`);
                }
            } else if (now >= start && now <= end) {
                // In progress
                const diffMs = end.getTime() - now.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                if (diffHours > 0) {
                    setTimeRemainingText(`En curso - Finaliza en ${diffHours}h ${diffMins}m`);
                } else {
                    setTimeRemainingText(`En curso - Finaliza en ${diffMins}m`);
                }
            } else {
                setTimeRemainingText('Finalizado');
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [currentEvent]);

    // Custom Interactive SVG Line Chart generator for sales over time
    const salesChartSvg = useMemo(() => {
        if (!summary || summary.sales.salesOverTime.length === 0) return null;

        const data = summary.sales.salesOverTime;
        const maxVal = Math.max(...data.map((d) => d.revenueUSD), 10);
        const W = 600;
        const H = 140;
        const pad = 12;

        const stepX = data.length > 1 ? (W - pad * 2) / (data.length - 1) : W - pad * 2;
        const points = data.map((d, i) => [
            pad + i * stepX,
            H - pad - (d.revenueUSD / maxVal) * (H - pad * 2 - 20) - 5,
        ]);

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');
        const areaPath = linePath + ` L${W - pad} ${H - pad} L${pad} ${H - pad} Z`;

        return {
            points,
            linePath,
            areaPath,
            maxVal,
            W,
            H,
            pad,
        };
    }, [summary]);

    // Custom Interactive SVG Line Chart generator for check-ins over time
    const checkinsChartSvg = useMemo(() => {
        if (!summary || summary.attendance.checkinsOverTime.length === 0) return null;

        const data = summary.attendance.checkinsOverTime;
        const maxVal = Math.max(...data.map((d) => d.count), 5);
        const W = 600;
        const H = 140;
        const pad = 12;

        const stepX = data.length > 1 ? (W - pad * 2) / (data.length - 1) : W - pad * 2;
        const points = data.map((d, i) => [
            pad + i * stepX,
            H - pad - (d.count / maxVal) * (H - pad * 2 - 20) - 5,
        ]);

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');
        const areaPath = linePath + ` L${W - pad} ${H - pad} L${pad} ${H - pad} Z`;

        return {
            points,
            linePath,
            areaPath,
            maxVal,
            W,
            H,
            pad,
        };
    }, [summary]);

    // Donut chart calculations for payment methods
    const donutSlices = useMemo(() => {
        if (!summary || summary.sales.salesByPaymentMethod.length === 0) return [];

        const data = summary.sales.salesByPaymentMethod;
        const totalUsd = summary.sales.totalRevenueUSD || 1;

        // Group amounts by method name (some methods might have VES/USD split)
        const grouped = new Map<string, number>();
        for (const item of data) {
            grouped.set(
                item.paymentMethodName,
                (grouped.get(item.paymentMethodName) || 0) + item.usdEquivalent,
            );
        }

        const colors = [
            'var(--primary)',
            'var(--secondary)',
            'var(--warning)',
            '#a78bfa',
            '#f472b6',
            '#60a5fa',
        ];

        let cumulativePercent = 0;

        return Array.from(grouped.entries()).map(([name, usdVal], index) => {
            const percent = (usdVal / totalUsd) * 100;
            const slice = {
                name,
                usdVal,
                percent,
                color: colors[index % colors.length],
                strokeDasharray: `${percent} ${100 - percent}`,
                strokeDashoffset: 100 - cumulativePercent + 25, // +25 to start at 12 o'clock
            };
            cumulativePercent += percent;
            return slice;
        });
    }, [summary]);

    if (isLoading) {
        return (
            <div
                style={{
                    height: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-sans)',
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        border: '4px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: 16,
                    }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Cargando dashboard del evento...
                </p>
            </div>
        );
    }

    if (error || !summary || !currentEvent) {
        return (
            <div
                className="card"
                style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-lg)',
                    maxWidth: 500,
                    margin: '40px auto',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)',
                }}
            >
                <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    size="3x"
                    style={{ color: 'var(--danger)', marginBottom: 16 }}
                />
                <h3
                    style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 10,
                    }}
                >
                    Error
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                    {error || 'No se pudieron cargar los datos agregados.'}
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        void fetchSummary();
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <FontAwesomeIcon icon={faSync} /> Reintentar
                </button>
            </div>
        );
    }

    // Dates formatting
    const eventStartDateVal = new Date(currentEvent.startDate);
    const eventEndDateVal = new Date(currentEvent.endDate);
    const sameDay = eventStartDateVal.toDateString() === eventEndDateVal.toDateString();

    const eventStartDateText = eventStartDateVal.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const eventEndDateText = eventEndDateVal.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const startTime = new Date(currentEvent.startTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const endTime = new Date(currentEvent.endTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div style={{ fontFamily: 'var(--font-sans)', position: 'relative' }}>
            {/* Live Notification Toasts in Corner */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            padding: '14px 20px',
                            borderRadius: 'var(--r-lg)',
                            boxShadow: 'var(--shadow-md)',
                            borderLeft: '4px solid var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            animation: 'slideInRight 0.3s ease-out',
                            pointerEvents: 'auto',
                            maxWidth: 320,
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: 'var(--success-light)',
                                color: 'var(--success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <FontAwesomeIcon icon={faQrcode} size="xs" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                                ¡Ingreso Registrado!
                            </div>
                            <div
                                style={{
                                    fontSize: 11.5,
                                    color: 'var(--text-secondary)',
                                    marginTop: 2,
                                }}
                            >
                                {toast.customerName} ({toast.ticketTypeName})
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: 'var(--text-disabled)',
                                marginLeft: 'auto',
                                alignSelf: 'flex-start',
                            }}
                        >
                            {toast.timestamp}
                        </div>
                    </div>
                ))}
            </div>

            {/* Header Dashboard Section */}
            <div
                className="card elevated"
                style={{
                    padding: '20px 24px',
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                    border: '1px solid var(--border)',
                }}
            >
                <div>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
                    >
                        <h1
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                margin: 0,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Dashboard: {summary.header.name}
                        </h1>
                        <span
                            className={`badge ${
                                summary.header.status === 'ACTIVE'
                                    ? 'success'
                                    : summary.header.status === 'CANCELLED'
                                      ? 'danger'
                                      : 'primary'
                            }`}
                            style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                borderRadius: 6,
                                fontWeight: 600,
                            }}
                        >
                            {summary.header.status === 'ACTIVE'
                                ? 'ACTIVO'
                                : summary.header.status === 'CANCELLED'
                                  ? 'CANCELADO'
                                  : 'BORRADOR'}
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 16,
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {sameDay ? (
                            <>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FontAwesomeIcon
                                        icon={faCalendarAlt}
                                        style={{ color: 'var(--primary)' }}
                                    />
                                    {eventStartDateText}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FontAwesomeIcon
                                        icon={faClock}
                                        style={{ color: 'var(--primary)' }}
                                    />
                                    {startTime} - {endTime}
                                </span>
                            </>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FontAwesomeIcon
                                    icon={faCalendarAlt}
                                    style={{ color: 'var(--primary)' }}
                                />
                                {eventStartDateText}, {startTime} - {eventEndDateText}, {endTime}
                            </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FontAwesomeIcon
                                icon={faMapMarkerAlt}
                                style={{ color: 'var(--primary)' }}
                            />
                            {summary.header.location}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* SSE Live Indicator */}
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 12px',
                            background: 'var(--bg-base)',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            fontSize: 12.5,
                            fontWeight: 500,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background:
                                    sseStatus === 'connected'
                                        ? 'var(--success)'
                                        : sseStatus === 'connecting'
                                          ? 'var(--warning)'
                                          : 'var(--danger)',
                                boxShadow:
                                    sseStatus === 'connected'
                                        ? '0 0 0 4px var(--success-light)'
                                        : 'none',
                                display: 'inline-block',
                                animation: sseStatus === 'connected' ? 'pulse 2s infinite' : 'none',
                            }}
                        />
                        <span style={{ color: 'var(--text-primary)' }}>
                            {sseStatus === 'connected'
                                ? 'En Vivo'
                                : sseStatus === 'connecting'
                                  ? 'Conectando...'
                                  : 'Reconectando...'}
                        </span>
                    </div>

                    {/* Countdown / Remaining info */}
                    <div style={{ textAlign: 'right' }}>
                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Tiempo restante
                        </div>
                        <div
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: 'var(--primary-dark)',
                                marginTop: 2,
                            }}
                        >
                            {timeRemainingText}
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                        className={`btn btn-ghost btn-icon ${isRefreshing ? 'disabled' : ''}`}
                        onClick={() => {
                            void fetchSummary(true);
                        }}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 8,
                        }}
                        title="Refrescar datos de ventas e inventario"
                        disabled={isRefreshing}
                    >
                        <FontAwesomeIcon
                            icon={faSync}
                            spin={isRefreshing}
                            style={{ color: 'var(--text-secondary)' }}
                        />
                    </button>
                </div>
            </div>

            {/* KPI Overview Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {/* Revenue Card */}
                <div
                    className="card elevated kpi"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <span
                            className="text-secondary"
                            style={{
                                fontSize: 12.5,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Recaudado Total
                        </span>
                        <div
                            style={{
                                fontSize: 26,
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                marginTop: 6,
                            }}
                        >
                            $
                            {summary.sales.totalRevenueUSD.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {summary.sales.totalOrdersCount} órdenes | Promedio: $
                            {summary.sales.averageTicketUSD.toFixed(2)}
                        </div>
                    </div>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FontAwesomeIcon icon={faDollarSign} size="lg" />
                    </div>
                </div>

                {/* Inventory / Occupancy Card */}
                <div
                    className="card elevated kpi"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <span
                            className="text-secondary"
                            style={{
                                fontSize: 12.5,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Ocupación de Aforo
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                                marginTop: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 26,
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                {summary.inventory.occupationPercentage}%
                            </span>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                ({summary.inventory.totalTicketsSold} /{' '}
                                {summary.inventory.totalTicketsCapacity})
                            </span>
                        </div>
                        <div
                            style={{
                                height: 6,
                                background: 'var(--border)',
                                borderRadius: 3,
                                marginTop: 10,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${summary.inventory.occupationPercentage}%`,
                                    background: 'var(--secondary)',
                                    borderRadius: 3,
                                    transition: 'width 0.4s ease-out',
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--secondary-light)',
                            color: 'var(--secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 16,
                        }}
                    >
                        <FontAwesomeIcon icon={faUsers} size="lg" />
                    </div>
                </div>

                {/* Door Attendance Card */}
                <div
                    className="card elevated kpi"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <span
                            className="text-secondary"
                            style={{
                                fontSize: 12.5,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            Asistencia en Puerta
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                                marginTop: 6,
                            }}
                        >
                            <span
                                style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)' }}
                            >
                                {summary.attendance.attendancePercentage}%
                            </span>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                ({summary.attendance.usedTicketsCount} /{' '}
                                {summary.attendance.totalIssuedTicketsCount})
                            </span>
                        </div>
                        <div
                            style={{
                                height: 6,
                                background: 'var(--border)',
                                borderRadius: 3,
                                marginTop: 10,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${summary.attendance.attendancePercentage}%`,
                                    background: 'var(--success)',
                                    borderRadius: 3,
                                    transition: 'width 0.4s ease-out',
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'var(--success-light)',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 16,
                        }}
                    >
                        <FontAwesomeIcon icon={faQrcode} size="lg" />
                    </div>
                </div>
            </div>

            {/* Live door status alert for failed checks */}
            {(summary.attendance.failedAttemptsCount.alreadyUsed > 0 ||
                summary.attendance.failedAttemptsCount.invalid > 0) && (
                <div
                    className="card"
                    style={{
                        padding: '12px 18px',
                        background: 'var(--danger-light)',
                        border: '1px solid #f87171',
                        borderRadius: 'var(--r-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 24,
                    }}
                >
                    <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        style={{ color: 'var(--danger)', fontSize: 18 }}
                    />
                    <div style={{ fontSize: 13.5, color: 'var(--danger)' }}>
                        <strong>Alerta de Puerta:</strong> Se han detectado intentos fallidos de
                        ingreso: {summary.attendance.failedAttemptsCount.alreadyUsed} duplicados (ya
                        usados) y {summary.attendance.failedAttemptsCount.invalid} inválidos. Revisa
                        los registros detallados en Puerta.
                    </div>
                </div>
            )}

            {/* Detailed Graphs Row */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                    gap: 20,
                    marginBottom: 24,
                }}
            >
                {/* Sales Evolution Line Chart */}
                <div
                    className="card elevated"
                    style={{ padding: 20, border: '1px solid var(--border)' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    margin: 0,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Ventas en el Tiempo
                            </h3>
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: 'var(--text-secondary)',
                                    margin: '2px 0 0',
                                }}
                            >
                                Ingresos acumulados en USD por bloque temporal
                            </p>
                        </div>
                        <span
                            className="badge"
                            style={{
                                background: 'var(--primary-light)',
                                color: 'var(--primary-dark)',
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        >
                            Histórico de Ventas
                        </span>
                    </div>

                    {salesChartSvg ? (
                        <div>
                            <div style={{ height: 150, position: 'relative' }}>
                                <svg
                                    viewBox={`0 0 ${salesChartSvg.W} ${salesChartSvg.H}`}
                                    width="100%"
                                    height="100%"
                                >
                                    <defs>
                                        <linearGradient id="salesGrad" x1="0" x2="0" y1="0" y2="1">
                                            <stop
                                                offset="0%"
                                                stopColor="var(--primary)"
                                                stopOpacity="0.22"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--primary)"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>
                                    {/* Horizontal grid lines */}
                                    {[0.25, 0.5, 0.75].map((t) => (
                                        <line
                                            key={t}
                                            x1={salesChartSvg.pad}
                                            x2={salesChartSvg.W - salesChartSvg.pad}
                                            y1={salesChartSvg.H * t}
                                            y2={salesChartSvg.H * t}
                                            stroke="var(--border)"
                                            strokeDasharray="3 4"
                                            strokeWidth="1"
                                        />
                                    ))}
                                    {/* Paths */}
                                    <path d={salesChartSvg.areaPath} fill="url(#salesGrad)" />
                                    <path
                                        d={salesChartSvg.linePath}
                                        fill="none"
                                        stroke="var(--primary)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    {/* Interactive points */}
                                    {salesChartSvg.points.map((p, i) => (
                                        <g key={i} className="chart-dot">
                                            <circle
                                                cx={p[0]}
                                                cy={p[1]}
                                                r="4.5"
                                                fill="var(--primary)"
                                                stroke="var(--bg-elevated)"
                                                strokeWidth="1.5"
                                            />
                                            <title>
                                                {summary.sales.salesOverTime[i].timeGroup}: $
                                                {summary.sales.salesOverTime[i].revenueUSD} (
                                                {summary.sales.salesOverTime[i].quantitySold} uds)
                                            </title>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 11,
                                    color: 'var(--text-secondary)',
                                    marginTop: 8,
                                    padding: '0 8px',
                                }}
                            >
                                <span>
                                    {summary.sales.salesOverTime[0]?.timeGroup.split(' ')[1] ||
                                        summary.sales.salesOverTime[0]?.timeGroup}
                                </span>
                                <span>
                                    Total: ${summary.sales.totalRevenueUSD.toLocaleString()}
                                </span>
                                <span>
                                    {summary.sales.salesOverTime[
                                        summary.sales.salesOverTime.length - 1
                                    ]?.timeGroup.split(' ')[1] ||
                                        summary.sales.salesOverTime[
                                            summary.sales.salesOverTime.length - 1
                                        ]?.timeGroup}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                height: 150,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-base)',
                                borderRadius: 'var(--r-lg)',
                                fontSize: 13.5,
                            }}
                        >
                            No hay órdenes registradas para este evento.
                        </div>
                    )}
                </div>

                {/* Door check-in flow chart (SSE updated!) */}
                <div
                    className="card elevated"
                    style={{ padding: 20, border: '1px solid var(--border)' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    margin: 0,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Flujo de Ingresos (En Vivo)
                            </h3>
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: 'var(--text-secondary)',
                                    margin: '2px 0 0',
                                }}
                            >
                                Conteo de check-ins exitosos agrupados por minuto
                            </p>
                        </div>
                    </div>

                    {checkinsChartSvg ? (
                        <div>
                            <div style={{ height: 150, position: 'relative' }}>
                                <svg
                                    viewBox={`0 0 ${checkinsChartSvg.W} ${checkinsChartSvg.H}`}
                                    width="100%"
                                    height="100%"
                                >
                                    <defs>
                                        <linearGradient
                                            id="checkinsGrad"
                                            x1="0"
                                            x2="0"
                                            y1="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="var(--success)"
                                                stopOpacity="0.22"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--success)"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>
                                    {[0.25, 0.5, 0.75].map((t) => (
                                        <line
                                            key={t}
                                            x1={checkinsChartSvg.pad}
                                            x2={checkinsChartSvg.W - checkinsChartSvg.pad}
                                            y1={checkinsChartSvg.H * t}
                                            y2={checkinsChartSvg.H * t}
                                            stroke="var(--border)"
                                            strokeDasharray="3 4"
                                            strokeWidth="1"
                                        />
                                    ))}
                                    <path d={checkinsChartSvg.areaPath} fill="url(#checkinsGrad)" />
                                    <path
                                        d={checkinsChartSvg.linePath}
                                        fill="none"
                                        stroke="var(--success)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    {checkinsChartSvg.points.map((p, i) => (
                                        <g key={i} className="chart-dot">
                                            <circle
                                                cx={p[0]}
                                                cy={p[1]}
                                                r="4.5"
                                                fill="var(--success)"
                                                stroke="var(--bg-elevated)"
                                                strokeWidth="1.5"
                                            />
                                            <title>
                                                {summary.attendance.checkinsOverTime[i].timeGroup}:{' '}
                                                {summary.attendance.checkinsOverTime[i].count}{' '}
                                                ingresos
                                            </title>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 11,
                                    color: 'var(--text-secondary)',
                                    marginTop: 8,
                                    padding: '0 8px',
                                }}
                            >
                                <span>
                                    {summary.attendance.checkinsOverTime[0]?.timeGroup.split(
                                        ' ',
                                    )[1] || summary.attendance.checkinsOverTime[0]?.timeGroup}
                                </span>
                                <span>Ingresos Totales: {summary.attendance.usedTicketsCount}</span>
                                <span>
                                    {summary.attendance.checkinsOverTime[
                                        summary.attendance.checkinsOverTime.length - 1
                                    ]?.timeGroup.split(' ')[1] ||
                                        summary.attendance.checkinsOverTime[
                                            summary.attendance.checkinsOverTime.length - 1
                                        ]?.timeGroup}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                height: 150,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-base)',
                                borderRadius: 'var(--r-lg)',
                                fontSize: 13.5,
                            }}
                        >
                            Aún no se registran ingresos en puerta. ¡Comienza a validar QRs!
                        </div>
                    )}
                </div>
            </div>

            {/* Sales breakdown, Inventory & Sellers */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 20,
                    marginBottom: 24,
                }}
            >
                {/* Inventory / Ticket Progress Bar list */}
                <div
                    className="card elevated"
                    style={{ padding: 20, border: '1px solid var(--border)' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 18,
                        }}
                    >
                        <h3
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Inventario por Tipo
                        </h3>
                        <span
                            className="badge"
                            style={{
                                background: 'var(--secondary-light)',
                                color: 'var(--secondary-dark)',
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        >
                            {summary.inventory.byTicketType.length} tipos de entrada
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {summary.inventory.byTicketType.map((tt) => (
                            <div
                                key={tt.ticketTypeId}
                                style={{
                                    borderBottom: '1px solid var(--bg-base)',
                                    paddingBottom: 10,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 13,
                                        marginBottom: 5,
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {tt.ticketTypeName}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {tt.soldQuantity} / {tt.totalQuantity} vendidas
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: 6,
                                        background: 'var(--bg-base)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${tt.soldPercentage}%`,
                                            background: tt.isSoldOut
                                                ? 'var(--danger)'
                                                : 'var(--primary)',
                                            borderRadius: 3,
                                            transition: 'width 0.4s ease-out',
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 11,
                                        color: 'var(--text-secondary)',
                                        marginTop: 4,
                                    }}
                                >
                                    <span>
                                        Precio: {tt.currency} {tt.price.toFixed(2)}
                                    </span>
                                    <span>
                                        {tt.isSoldOut ? (
                                            <span
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontWeight: 700,
                                                    animation: 'pulse 1s infinite',
                                                }}
                                            >
                                                AGOTADO
                                            </span>
                                        ) : (
                                            <span>Disponible: {tt.availableQuantity}</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Donut chart and Currency Breakdown */}
                <div
                    className="card elevated"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <h3
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                marginBottom: 18,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Métodos de Pago
                        </h3>

                        {donutSlices.length > 0 ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 24,
                                    margin: '12px 0 20px',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'relative',
                                        width: 110,
                                        height: 110,
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg viewBox="0 0 42 42" width="100%" height="100%">
                                        {donutSlices.map((slice, i) => (
                                            <circle
                                                key={i}
                                                cx="21"
                                                cy="21"
                                                r="15.91549430918954"
                                                fill="transparent"
                                                stroke={slice.color}
                                                strokeWidth="4.5"
                                                strokeDasharray={slice.strokeDasharray}
                                                strokeDashoffset={slice.strokeDashoffset}
                                            />
                                        ))}
                                    </svg>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Ingresos
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            USD
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                        flex: 1,
                                        maxHeight: 120,
                                        overflowY: 'auto',
                                    }}
                                >
                                    {donutSlices.map((slice, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontSize: 11.5,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    background: slice.color,
                                                    display: 'inline-block',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: 100,
                                                    color: 'var(--text-primary)',
                                                }}
                                                title={slice.name}
                                            >
                                                {slice.name}
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: 600,
                                                    marginLeft: 'auto',
                                                    color: 'var(--text-primary)',
                                                }}
                                            >
                                                {slice.percent.toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '24px 0',
                                    textAlign: 'center',
                                    color: 'var(--text-disabled)',
                                    fontSize: 13.5,
                                }}
                            >
                                Sin desglose disponible.
                            </div>
                        )}
                    </div>

                    {/* Breakdown by original currency */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <FontAwesomeIcon icon={faCoins} style={{ color: 'var(--warning)' }} />
                            Recaudado por Moneda
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {summary.sales.salesByCurrency.map((c) => (
                                <div
                                    key={c.currency}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: 12.5,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>{c.currency}</span>
                                    <span>
                                        {c.originalAmount.toLocaleString()} {c.currency}
                                        {c.currency !== 'USD' && (
                                            <span
                                                style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: 11,
                                                    marginLeft: 6,
                                                }}
                                            >
                                                (equiv. ${c.usdEquivalent.toLocaleString()} USD)
                                            </span>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sellers Ranking */}
                <div
                    className="card elevated"
                    style={{ padding: 20, border: '1px solid var(--border)' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16,
                        }}
                    >
                        <h3
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Ventas por Vendedor
                        </h3>
                        <FontAwesomeIcon icon={faTrophy} style={{ color: 'var(--warning)' }} />
                    </div>

                    {summary.sales.salesBySeller.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            textAlign: 'left',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        <th style={{ padding: '8px 4px', fontWeight: 500 }}>
                                            Vendedor
                                        </th>
                                        <th
                                            style={{
                                                padding: '8px 4px',
                                                fontWeight: 500,
                                                textAlign: 'center',
                                            }}
                                        >
                                            Uds
                                        </th>
                                        <th
                                            style={{
                                                padding: '8px 4px',
                                                fontWeight: 500,
                                                textAlign: 'right',
                                            }}
                                        >
                                            Total (USD)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.sales.salesBySeller.map((seller, index) => (
                                        <tr
                                            key={seller.sellerId}
                                            style={{ borderBottom: '1px solid var(--bg-base)' }}
                                        >
                                            <td
                                                style={{
                                                    padding: '10px 4px',
                                                    color: 'var(--text-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                {index === 0 && (
                                                    <span style={{ fontSize: 13 }}>🥇</span>
                                                )}
                                                {index === 1 && (
                                                    <span style={{ fontSize: 13 }}>🥈</span>
                                                )}
                                                {index === 2 && (
                                                    <span style={{ fontSize: 13 }}>🥉</span>
                                                )}
                                                {index > 2 && (
                                                    <span
                                                        style={{
                                                            color: 'var(--text-disabled)',
                                                            width: 16,
                                                            display: 'inline-block',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </span>
                                                )}
                                                {seller.sellerName}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 4px',
                                                    color: 'var(--text-secondary)',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {seller.quantitySold}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '10px 4px',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: 600,
                                                    textAlign: 'right',
                                                }}
                                            >
                                                $
                                                {seller.revenueUSD.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: '32px 0',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: 13.5,
                            }}
                        >
                            No hay vendedores registrados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

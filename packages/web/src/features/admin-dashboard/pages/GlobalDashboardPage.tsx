import { GlobalDashboardSummary, GlobalDashboardQuery } from '@eventflow/shared';
import {
    faSearch,
    faDollarSign,
    faInbox,
    faUsers,
    faQrcode,
    faCalendarAlt,
    faExclamationTriangle,
    faSync,
    faSpinner,
    faChevronLeft,
    faChevronRight,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/AuthContext';
import { adminDashboardService } from '../services/adminDashboardService';

export function GlobalDashboardPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Route Guard (block non-admin users)
    useEffect(() => {
        if (currentUser && currentUser.role !== 'ADMIN') {
            void navigate('/', { replace: true });
        }
    }, [currentUser, navigate]);

    // UI States
    const [summary, setSummary] = useState<GlobalDashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on new search
        }, 300);

        return () => clearTimeout(handler);
    }, [search]);

    // Fetch Global Dashboard Summary
    const fetchSummary = useCallback(
        async (showRefreshIndicator = false) => {
            if (showRefreshIndicator) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            try {
                const query: Partial<GlobalDashboardQuery> = {
                    page,
                    limit: 10,
                    search: debouncedSearch || undefined,
                    status: (statusFilter as 'DRAFT' | 'ACTIVE' | 'CANCELLED') || undefined,
                    sortBy: (sortBy as 'revenue' | 'occupancy' | 'attendance') || undefined,
                    sortOrder,
                };

                const data = await adminDashboardService.getGlobalSummary(query);
                setSummary(data);
            } catch (err: unknown) {
                console.error('Error fetching global dashboard summary:', err);
                setError('No se pudieron cargar las métricas consolidadas del sistema.');
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [page, debouncedSearch, statusFilter, sortBy, sortOrder],
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchSummary();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchSummary]);

    if (isLoading && !summary) {
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
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    size="2x"
                    style={{ color: 'var(--primary)', marginBottom: 16 }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Cargando dashboard general...
                </p>
            </div>
        );
    }

    if (error && !summary) {
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
                    {error}
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => void fetchSummary()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <FontAwesomeIcon icon={faSync} /> Reintentar
                </button>
            </div>
        );
    }

    const kpis = summary?.kpis;
    const eventSummaries = summary?.eventSummaries;
    const events = eventSummaries?.items || [];
    const totalEvents = eventSummaries?.total || 0;
    const totalPages = eventSummaries?.totalPages || 1;

    return (
        <div style={{ fontFamily: 'var(--font-sans)', position: 'relative' }}>
            {/* Header section */}
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
                    <h1
                        style={{
                            fontSize: 22,
                            fontWeight: 700,
                            margin: 0,
                            color: 'var(--text-primary)',
                            marginBottom: 4,
                        }}
                    >
                        Dashboard General de la Plataforma
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                        Resumen consolidado y estado global de todos los eventos registrados
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Status Badges Group */}
                    <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
                        <span className="badge primary" style={{ fontSize: 11 }}>
                            {kpis?.eventsActiveCount || 0} Activos
                        </span>
                        <span className="badge default" style={{ fontSize: 11 }}>
                            {(kpis?.eventsCreatedCount || 0) -
                                (kpis?.eventsActiveCount || 0) -
                                (kpis?.eventsCancelledCount || 0)}{' '}
                            Borradores
                        </span>
                        <span className="badge danger" style={{ fontSize: 11 }}>
                            {kpis?.eventsCancelledCount || 0} Cancelados
                        </span>
                    </div>

                    <button
                        className={`btn btn-ghost btn-icon ${isRefreshing ? 'disabled' : ''}`}
                        onClick={() => void fetchSummary(true)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                        title="Refrescar métricas globales"
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

            {/* KPI Cards Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <span className="kpi-label">Ingresos Totales (USD)</span>
                        <div
                            className="kpi-value"
                            style={{
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                fontSize: 26,
                                marginTop: 4,
                            }}
                        >
                            $
                            {kpis?.totalRevenueUSD.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </div>
                        <div className="kpi-sub" style={{ marginTop: 4 }}>
                            Consolidado global en USD
                        </div>
                    </div>
                    <div
                        className="avatar"
                        style={{
                            width: 44,
                            height: 44,
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                        }}
                    >
                        <FontAwesomeIcon icon={faDollarSign} size="lg" />
                    </div>
                </div>

                {/* Ticket Volume Card */}
                <div
                    className="card elevated kpi"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <span className="kpi-label">Entradas Vendidas</span>
                        <div
                            className="kpi-value"
                            style={{
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                fontSize: 26,
                                marginTop: 4,
                            }}
                        >
                            {kpis?.totalTicketsSold.toLocaleString()}
                        </div>
                        <div className="kpi-sub" style={{ marginTop: 4 }}>
                            Tickets emitidos en la plataforma
                        </div>
                    </div>
                    <div
                        className="avatar"
                        style={{
                            width: 44,
                            height: 44,
                            background: 'var(--secondary-light)',
                            color: 'var(--secondary)',
                        }}
                    >
                        <FontAwesomeIcon icon={faInbox} size="lg" />
                    </div>
                </div>

                {/* Occupancy Card */}
                <div
                    className="card elevated kpi"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <span className="kpi-label">Ocupación de Aforo Global</span>
                        <div
                            className="kpi-value"
                            style={{
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                fontSize: 26,
                                marginTop: 4,
                            }}
                        >
                            {kpis?.globalOccupationPercentage}%
                        </div>
                        <div style={{ width: '100%', marginTop: 8 }}>
                            <div className="progress" style={{ width: 140 }}>
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${Math.min(kpis?.globalOccupationPercentage || 0, 100)}%`,
                                        background: 'var(--warning)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div
                        className="avatar"
                        style={{
                            width: 44,
                            height: 44,
                            background: 'var(--warning-light)',
                            color: 'var(--warning)',
                        }}
                    >
                        <FontAwesomeIcon icon={faUsers} size="lg" />
                    </div>
                </div>

                {/* Attendance Card */}
                <div
                    className="card elevated kpi"
                    style={{
                        padding: 20,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <span className="kpi-label">Asistencia Global</span>
                        <div
                            className="kpi-value"
                            style={{
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                fontSize: 26,
                                marginTop: 4,
                            }}
                        >
                            {kpis?.globalAttendancePercentage}%
                        </div>
                        <div className="kpi-sub" style={{ marginTop: 4 }}>
                            Tickets usados vs emitidos
                        </div>
                    </div>
                    <div
                        className="avatar"
                        style={{
                            width: 44,
                            height: 44,
                            background: 'var(--success-light)',
                            color: 'var(--success)',
                        }}
                    >
                        <FontAwesomeIcon icon={faQrcode} size="lg" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Section */}
            <div
                className="card mb-4"
                style={{
                    display: 'flex',
                    gap: 14,
                    padding: 14,
                    marginBottom: 20,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {/* Search box */}
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <input
                        className="input"
                        placeholder="Buscar evento por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '36px' }}
                    />
                    <FontAwesomeIcon
                        icon={faSearch}
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-disabled)',
                            pointerEvents: 'none',
                        }}
                    />
                </div>

                {/* Status Filter */}
                <div style={{ minWidth: '160px' }}>
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="ACTIVE">Activo</option>
                        <option value="DRAFT">Borrador</option>
                        <option value="CANCELLED">Cancelado</option>
                    </select>
                </div>

                {/* Sort By Filter */}
                <div style={{ minWidth: '180px' }}>
                    <select
                        className="select"
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Ordenar por: Nombre</option>
                        <option value="revenue">Recaudación</option>
                        <option value="occupancy">Ocupación de Aforo</option>
                        <option value="attendance">Asistencia</option>
                    </select>
                </div>

                {/* Sort Order Toggle */}
                {sortBy && (
                    <div>
                        <select
                            className="select"
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value as 'asc' | 'desc');
                                setPage(1);
                            }}
                            style={{ minWidth: '100px' }}
                        >
                            <option value="desc">Descendente</option>
                            <option value="asc">Ascendente</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Events List / Table */}
            <div className="table-wrap">
                {isRefreshing ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            size="2x"
                            style={{ color: 'var(--primary)', marginBottom: 12 }}
                        />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            Actualizando datos de eventos...
                        </p>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            No se encontraron eventos coincidentes.
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Evento</th>
                                <th>Estado</th>
                                <th>Recaudado</th>
                                <th>Ocupación de Aforo</th>
                                <th>Asistencia en Puerta</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => {
                                const capacity = event.capacity;
                                const sold = event.ticketsSold;
                                const occupationPct = capacity > 0 ? (sold / capacity) * 100 : 0;

                                return (
                                    <tr key={event.id}>
                                        <td>
                                            <div className="row" style={{ gap: 10 }}>
                                                <div
                                                    className="avatar"
                                                    style={{
                                                        background:
                                                            event.status === 'ACTIVE'
                                                                ? 'var(--secondary)'
                                                                : event.status === 'CANCELLED'
                                                                  ? 'var(--danger)'
                                                                  : 'var(--text-disabled)',
                                                        width: 32,
                                                        height: 32,
                                                    }}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faCalendarAlt}
                                                        size="xs"
                                                    />
                                                </div>
                                                <span style={{ fontWeight: 600 }}>
                                                    {event.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    event.status === 'ACTIVE'
                                                        ? 'success'
                                                        : event.status === 'CANCELLED'
                                                          ? 'danger'
                                                          : 'default'
                                                }`}
                                            >
                                                {event.status === 'ACTIVE'
                                                    ? 'Activo'
                                                    : event.status === 'CANCELLED'
                                                      ? 'Cancelado'
                                                      : 'Borrador'}
                                            </span>
                                        </td>
                                        <td
                                            className="fw-600 font-mono"
                                            style={{ fontWeight: 600 }}
                                        >
                                            $
                                            {event.revenueUSD.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 12.5,
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    <strong>{sold.toLocaleString()}</strong> /{' '}
                                                    {capacity.toLocaleString()}{' '}
                                                    <span
                                                        style={{
                                                            color: 'var(--text-secondary)',
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        ({occupationPct.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div
                                                    className="progress"
                                                    style={{ width: '100%', maxWidth: 180 }}
                                                >
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${Math.min(occupationPct, 100)}%`,
                                                            background:
                                                                occupationPct >= 90
                                                                    ? 'var(--success)'
                                                                    : occupationPct >= 50
                                                                      ? 'var(--primary)'
                                                                      : 'var(--warning)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                }}
                                            >
                                                <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                                                    {event.attendancePercentage}%
                                                </span>
                                                <span
                                                    className="badge success dot"
                                                    style={{
                                                        padding: 0,
                                                        background: 'transparent',
                                                        visibility:
                                                            event.attendancePercentage > 0
                                                                ? 'visible'
                                                                : 'hidden',
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() =>
                                                    void navigate(`/events/${event.id}/dashboard`)
                                                }
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                Ver Dashboard
                                                <FontAwesomeIcon icon={faArrowRight} size="xs" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 18,
                        padding: '0 8px',
                    }}
                >
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        style={{ opacity: page === 1 ? 0.5 : 1 }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} /> Anterior
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Página <strong>{page}</strong> de <strong>{totalPages}</strong> (
                        {totalEvents} eventos)
                    </span>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        style={{ opacity: page === totalPages ? 0.5 : 1 }}
                    >
                        Siguiente <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            )}
        </div>
    );
}

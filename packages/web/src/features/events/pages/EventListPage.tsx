import { EventType, EventStatus } from '@eventflow/shared';
import { EventToCreateSchema } from '@eventflow/shared';
import {
    faSearch,
    faPlus,
    faCalendarAlt,
    faList,
    faUsers,
    faSpinner,
    faExclamationTriangle,
    faCheckCircle,
    faTimes,
    faChevronLeft,
    faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/AuthContext';
import { eventService } from '../services/eventService';

export function EventListPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Core States
    const [events, setEvents] = useState<EventType[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('Todos');
    const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calendar States
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // Fetch Events list
    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const apiStatus = statusFilter === 'Todos' ? undefined : statusFilter;
            const res = await eventService.listEvents({
                page,
                limit,
                search: debouncedSearch || undefined,
                status: apiStatus,
            });

            setEvents(res.events);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Error al cargar el catálogo de eventos.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchEvents();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchEvents]);

    // React Hook Form for creation
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(EventToCreateSchema),
        defaultValues: {
            name: '',
            description: '',
            date: '',
            startTime: '',
            endTime: '',
            location: '',
            address: '',
            maxCapacity: 100,
            imageUrl: '',
        },
    });

    const onSubmit = async (data: FieldValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            // Use the raw YYYY-MM-DD date directly — avoid new Date() which interprets it as UTC
            // and can shift the day backwards in negative UTC offsets (e.g. UTC-4).
            const dateStr = data.date as string; // "YYYY-MM-DD" from <input type="date">
            const startTimeStr = data.startTime as string; // "HH:MM" from <input type="time">
            const endTimeStr = data.endTime as string;

            const dateISO = new Date(`${dateStr}T12:00:00`).toISOString();
            const startTimeISO = new Date(`${dateStr}T${startTimeStr}:00`).toISOString();
            const endTimeISO = new Date(`${dateStr}T${endTimeStr}:00`).toISOString();

            await eventService.createEvent({
                name: data.name as string,
                description: data.description as string,
                date: dateISO,
                startTime: startTimeISO,
                endTime: endTimeISO,
                location: data.location as string,
                address: data.address as string,
                maxCapacity: data.maxCapacity as number,
                imageUrl: data.imageUrl as string,
            });

            setSuccessMessage('¡Evento creado con éxito!');
            setIsCreateOpen(false);
            reset();
            void fetchEvents();

            setTimeout(() => {
                setSuccessMessage(null);
            }, 4000);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Error al crear el evento.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Month Navigation
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Helper to format months
    const monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ];

    // Calendar Generation
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    // Map status kinds for styling
    const getStatusStyle = (status: EventStatus) => {
        if (status === 'ACTIVE')
            return { bg: 'var(--success-light)', color: 'var(--success)', label: 'ACTIVO' };
        if (status === 'CANCELLED')
            return { bg: 'var(--danger-light)', color: 'var(--danger)', label: 'CANCELADO' };
        return {
            bg: 'var(--primary-light)',
            color: 'var(--primary)',
            label: 'PREVENTA / BORRADOR',
        };
    };

    return (
        <div>
            {/* Header */}
            <div
                className="page-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    <h1
                        className="page-title"
                        style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                        Eventos
                    </h1>
                    <p
                        className="page-subtitle"
                        style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                    >
                        {total} eventos registrados ·{' '}
                        {events.filter((e) => e.status === 'ACTIVE').length} activos
                    </p>
                </div>

                {currentUser?.role === 'ADMIN' && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsCreateOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Crear nuevo evento
                    </button>
                )}
            </div>

            {/* Success and Error Banners */}
            {successMessage && (
                <div
                    className="badge success"
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--r-lg)',
                        marginBottom: 16,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div
                    className="badge danger"
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 'var(--r-lg)',
                        marginBottom: 16,
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filters Bar */}
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
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <input
                        className="input"
                        placeholder="Buscar por nombre, descripción o lugar..."
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

                {/* Status selector pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Todos', 'DRAFT', 'ACTIVE', 'CANCELLED'].map((s) => (
                        <button
                            key={s}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-secondary' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter(s)}
                            style={{
                                borderRadius: 8,
                                padding: '6px 12px',
                                fontSize: 13.5,
                            }}
                        >
                            {s === 'Todos'
                                ? 'Todos'
                                : s === 'DRAFT'
                                  ? 'Preventa'
                                  : s === 'ACTIVE'
                                    ? 'Activos'
                                    : 'Cancelados'}
                        </button>
                    ))}
                </div>

                {/* View switcher */}
                <div
                    style={{
                        display: 'flex',
                        background: 'var(--bg-base)',
                        borderRadius: 8,
                        padding: 3,
                        gap: 2,
                        marginLeft: 'auto',
                    }}
                >
                    <button
                        onClick={() => setViewMode('cards')}
                        className="btn btn-sm"
                        style={{
                            background: viewMode === 'cards' ? 'var(--bg-elevated)' : 'transparent',
                            boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                        }}
                    >
                        <FontAwesomeIcon icon={faList} />
                        Tarjetas
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className="btn btn-sm"
                        style={{
                            background:
                                viewMode === 'calendar' ? 'var(--bg-elevated)' : 'transparent',
                            boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                        }}
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        Calendario
                    </button>
                </div>
            </div>

            {/* Content view */}
            {isLoading ? (
                <div style={{ padding: '80px 0', textAlign: 'center' }}>
                    <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        size="2x"
                        style={{ color: 'var(--primary)', marginBottom: 12 }}
                    />
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Cargando catálogo de eventos...
                    </p>
                </div>
            ) : viewMode === 'cards' ? (
                // CARDS GRID
                events.length === 0 ? (
                    <div
                        className="card"
                        style={{
                            padding: '60px 24px',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-sans)',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faCalendarAlt}
                            size="2x"
                            style={{ color: 'var(--text-disabled)', marginBottom: 12 }}
                        />
                        <p style={{ fontSize: 15, fontWeight: 550, margin: 0 }}>
                            No se encontraron eventos en esta categoría.
                        </p>
                        {currentUser?.role === 'ADMIN' && (
                            <p style={{ fontSize: 13, marginTop: 4 }}>
                                Crea un evento nuevo presionando el botón &quot;Crear nuevo
                                evento&quot;.
                            </p>
                        )}
                    </div>
                ) : (
                    <div>
                        <div
                            className="grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                                gap: 20,
                            }}
                        >
                            {events.map((e) => {
                                const statusInfo = getStatusStyle(e.status);
                                const dateFormatted = new Date(e.date).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                });

                                return (
                                    <div
                                        key={e.id}
                                        className="card elevated"
                                        onClick={() => {
                                            void navigate(`/events/${e.id}/dashboard`);
                                        }}
                                        style={{
                                            padding: 0,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            border: '1px solid var(--border)',
                                        }}
                                        onMouseEnter={(el) => {
                                            el.currentTarget.style.transform = 'translateY(-3px)';
                                            el.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        }}
                                        onMouseLeave={(el) => {
                                            el.currentTarget.style.transform = 'none';
                                            el.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                height: 140,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <img
                                                src={e.imageUrl}
                                                alt={e.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <div
                                                style={{ position: 'absolute', top: 10, left: 10 }}
                                            >
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: statusInfo.bg,
                                                        color: statusInfo.color,
                                                        fontWeight: 600,
                                                        fontSize: 11,
                                                        padding: '4px 8px',
                                                        borderRadius: 6,
                                                    }}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                padding: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flex: 1,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: 6,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <span style={{ fontWeight: 500 }}>
                                                    {dateFormatted}
                                                </span>
                                                <span>·</span>
                                                <span
                                                    style={{
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {e.location}
                                                </span>
                                            </div>

                                            <h3
                                                style={{
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    marginBottom: 12,
                                                    lineHeight: 1.3,
                                                    fontFamily: 'var(--font-sans)',
                                                    flex: 1,
                                                }}
                                            >
                                                {e.name}
                                            </h3>

                                            <div
                                                className="row"
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: 13,
                                                    color: 'var(--text-secondary)',
                                                    marginTop: 'auto',
                                                    paddingTop: 12,
                                                    borderTop: '1px solid var(--border)',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faUsers} />
                                                    {e.maxCapacity} máx.
                                                </span>
                                                <span
                                                    style={{
                                                        color: 'var(--primary)',
                                                        fontWeight: 600,
                                                        fontSize: 12.5,
                                                    }}
                                                >
                                                    Administrar →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 24,
                                    padding: '0 8px',
                                }}
                            >
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    style={{ opacity: page === 1 ? 0.5 : 1 }}
                                >
                                    <FontAwesomeIcon
                                        icon={faChevronLeft}
                                        style={{ marginRight: 6 }}
                                    />{' '}
                                    Anterior
                                </button>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    Página <strong>{page}</strong> de <strong>{totalPages}</strong>{' '}
                                    ({total} eventos)
                                </span>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                    style={{ opacity: page === totalPages ? 0.5 : 1 }}
                                >
                                    Siguiente{' '}
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        style={{ marginLeft: 6 }}
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                )
            ) : (
                // CALENDAR VIEW
                <div className="card" style={{ padding: 20, border: '1px solid var(--border)' }}>
                    {/* Calendar month selector header */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}
                    >
                        <button className="btn btn-ghost btn-icon" onClick={prevMonth}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <h2
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-sans)',
                            }}
                        >
                            {monthNames[month]} de {year}
                        </h2>
                        <button className="btn btn-ghost btn-icon" onClick={nextMonth}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>

                    {/* Weekdays names grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            textAlign: 'center',
                            fontWeight: 600,
                            fontSize: 12.5,
                            color: 'var(--text-secondary)',
                            marginBottom: 10,
                            paddingBottom: 10,
                            borderBottom: '1px solid var(--border)',
                        }}
                    >
                        <div>Dom</div>
                        <div>Lun</div>
                        <div>Mar</div>
                        <div>Mié</div>
                        <div>Jue</div>
                        <div>Vie</div>
                        <div>Sáb</div>
                    </div>

                    {/* Days grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gridAutoRows: 'minmax(90px, auto)',
                            gap: 4,
                        }}
                    >
                        {/* Empty padding days */}
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                style={{
                                    background: 'var(--bg-surface)',
                                    borderRadius: 6,
                                    opacity: 0.45,
                                    border: '1px solid transparent',
                                }}
                            />
                        ))}

                        {/* Days numbers */}
                        {Array.from({ length: numDays }).map((_, i) => {
                            const day = i + 1;
                            const today = new Date();
                            const isToday =
                                today.getDate() === day &&
                                today.getMonth() === month &&
                                today.getFullYear() === year;

                            // Find events occurring on this specific day
                            const dayEvents = events.filter((e) => {
                                const ed = new Date(e.date);
                                return (
                                    ed.getDate() === day &&
                                    ed.getMonth() === month &&
                                    ed.getFullYear() === year
                                );
                            });

                            return (
                                <div
                                    key={`day-${day}`}
                                    style={{
                                        background: isToday
                                            ? 'var(--primary-light)'
                                            : 'var(--bg-elevated)',
                                        border: isToday
                                            ? '1px solid var(--primary)'
                                            : '1px solid var(--border)',
                                        borderRadius: 8,
                                        padding: '6px 8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        minHeight: 88,
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: isToday ? 700 : 500,
                                            color: isToday
                                                ? 'var(--primary-dark)'
                                                : 'var(--text-primary)',
                                            fontSize: 13,
                                            alignSelf: 'flex-start',
                                        }}
                                    >
                                        {day}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {dayEvents.map((de) => (
                                            <div
                                                key={de.id}
                                                onClick={() => {
                                                    void navigate(`/events/${de.id}/dashboard`);
                                                }}
                                                title={de.name}
                                                style={{
                                                    background: 'var(--secondary-light)',
                                                    color: 'var(--secondary-dark)',
                                                    fontSize: 10.5,
                                                    fontWeight: 600,
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    borderLeft: '2.5px solid var(--secondary)',
                                                }}
                                            >
                                                {de.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {isCreateOpen && (
                <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 540, width: '90%', padding: '24px' }}
                        onClick={(e) => e.stopPropagation()}
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
                                    fontSize: 18,
                                    fontWeight: 600,
                                    margin: 0,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Crear Nuevo Evento
                            </h3>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => setIsCreateOpen(false)}
                                style={{ border: 'none', background: 'none' }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <form
                            onSubmit={(ev) => {
                                void handleSubmit(onSubmit)(ev);
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Name */}
                                <div>
                                    <label
                                        className="text-small fw-600"
                                        style={{ display: 'block', marginBottom: 4 }}
                                    >
                                        Nombre del Evento *
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="Ej. Concierto de Rock Nacional"
                                        {...register('name')}
                                    />
                                    {errors.name && (
                                        <p
                                            style={{
                                                color: 'var(--danger)',
                                                fontSize: 11.5,
                                                marginTop: 4,
                                            }}
                                        >
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label
                                        className="text-small fw-600"
                                        style={{ display: 'block', marginBottom: 4 }}
                                    >
                                        Descripción *
                                    </label>
                                    <textarea
                                        className="input"
                                        placeholder="Escribe detalles importantes del evento..."
                                        rows={3}
                                        style={{
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            padding: 8,
                                        }}
                                        {...register('description')}
                                    />
                                    {errors.description && (
                                        <p
                                            style={{
                                                color: 'var(--danger)',
                                                fontSize: 11.5,
                                                marginTop: 4,
                                            }}
                                        >
                                            {errors.description.message}
                                        </p>
                                    )}
                                </div>

                                {/* Date & Time in a row */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <label
                                            className="text-small fw-600"
                                            style={{ display: 'block', marginBottom: 4 }}
                                        >
                                            Fecha *
                                        </label>
                                        <input
                                            className="input"
                                            type="date"
                                            {...register('date')}
                                        />
                                        {errors.date && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: 11.5,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {errors.date.message}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label
                                            className="text-small fw-600"
                                            style={{ display: 'block', marginBottom: 4 }}
                                        >
                                            Hora Inicio *
                                        </label>
                                        <input
                                            className="input"
                                            type="time"
                                            {...register('startTime')}
                                        />
                                        {errors.startTime && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: 11.5,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {errors.startTime.message}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label
                                            className="text-small fw-600"
                                            style={{ display: 'block', marginBottom: 4 }}
                                        >
                                            Hora Fin *
                                        </label>
                                        <input
                                            className="input"
                                            type="time"
                                            {...register('endTime')}
                                        />
                                        {errors.endTime && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: 11.5,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {errors.endTime.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Location & Max Capacity */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ flex: 2 }}>
                                        <label
                                            className="text-small fw-600"
                                            style={{ display: 'block', marginBottom: 4 }}
                                        >
                                            Lugar / Location *
                                        </label>
                                        <input
                                            className="input"
                                            placeholder="Ej. Centro Comercial Sambil"
                                            {...register('location')}
                                        />
                                        {errors.location && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: 11.5,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {errors.location.message}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label
                                            className="text-small fw-600"
                                            style={{ display: 'block', marginBottom: 4 }}
                                        >
                                            Capacidad Máx. *
                                        </label>
                                        <input
                                            className="input"
                                            type="number"
                                            {...register('maxCapacity')}
                                        />
                                        {errors.maxCapacity && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: 11.5,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {errors.maxCapacity.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label
                                        className="text-small fw-600"
                                        style={{ display: 'block', marginBottom: 4 }}
                                    >
                                        Dirección Exacta *
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="Ej. Av. Principal Libertador con Calle 4"
                                        {...register('address')}
                                    />
                                    {errors.address && (
                                        <p
                                            style={{
                                                color: 'var(--danger)',
                                                fontSize: 11.5,
                                                marginTop: 4,
                                            }}
                                        >
                                            {errors.address.message}
                                        </p>
                                    )}
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label
                                        className="text-small fw-600"
                                        style={{ display: 'block', marginBottom: 4 }}
                                    >
                                        URL de la Imagen (Opcional)
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="Ej. https://images.unsplash.com/..."
                                        {...register('imageUrl')}
                                    />
                                    {errors.imageUrl && (
                                        <p
                                            style={{
                                                color: 'var(--danger)',
                                                fontSize: 11.5,
                                                marginTop: 4,
                                            }}
                                        >
                                            {errors.imageUrl.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 10,
                                    marginTop: 20,
                                    borderTop: '1px solid var(--border)',
                                    paddingTop: 16,
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        reset();
                                        setError(null);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                        'Crear Evento'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

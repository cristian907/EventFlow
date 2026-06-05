import {
    TicketTypeToCreateSchema,
    TicketTypeToUpdateSchema,
    TicketTypeType,
} from '@eventflow/shared';
import {
    faPlus,
    faSpinner,
    faExclamationTriangle,
    faTicketAlt,
    faEdit,
    faBan,
    faCheckCircle,
    faBoxOpen,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { ticketTypeService } from '../services/ticketTypeService';

/* ─── State management ─── */
interface PageState {
    ticketTypes: TicketTypeType[];
    maxCapacity: number;
    totalAssigned: number;
    isLoading: boolean;
    error: string | null;
}

type PageAction =
    | { type: 'LOADING' }
    | {
          type: 'SUCCESS';
          ticketTypes: TicketTypeType[];
          maxCapacity: number;
          totalAssigned: number;
      }
    | { type: 'ERROR'; message: string };

function pageReducer(_state: PageState, action: PageAction): PageState {
    switch (action.type) {
        case 'LOADING':
            return { ..._state, isLoading: true, error: null };
        case 'SUCCESS':
            return {
                ticketTypes: action.ticketTypes,
                maxCapacity: action.maxCapacity,
                totalAssigned: action.totalAssigned,
                isLoading: false,
                error: null,
            };
        case 'ERROR':
            return { ..._state, isLoading: false, error: action.message };
    }
}

/* ─── Helper to extract API error messages ─── */
function getApiError(err: unknown): string {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return msg || 'Ocurrió un error inesperado.';
}

/* ─── Format helpers ─── */
function formatPrice(price: number, currency: string): string {
    return `${currency === 'VES' ? 'Bs.' : currency === 'EUR' ? '€' : '$'} ${price.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toDateTimeLocal(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ─── Capacity bar component ─── */
function CapacityBar({
    maxCapacity,
    totalAssigned,
}: {
    maxCapacity: number;
    totalAssigned: number;
}) {
    const pct = maxCapacity > 0 ? Math.min((totalAssigned / maxCapacity) * 100, 100) : 0;
    const remaining = maxCapacity - totalAssigned;

    const barColor =
        pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--secondary)';

    return (
        <div
            className="card elevated"
            style={{
                padding: '16px 20px',
                marginBottom: 20,
                border: '1px solid var(--border)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FontAwesomeIcon
                        icon={faInfoCircle}
                        style={{ color: 'var(--secondary)', fontSize: 14 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        Capacidad del Evento
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        Asignadas:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>{totalAssigned}</strong>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        Restantes:{' '}
                        <strong
                            style={{ color: remaining > 0 ? 'var(--success)' : 'var(--danger)' }}
                        >
                            {remaining}
                        </strong>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        Máximo:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>{maxCapacity}</strong>
                    </span>
                </div>
            </div>
            <div className="progress" style={{ height: 8 }}>
                <div
                    className="progress-fill"
                    style={{
                        width: `${pct}%`,
                        background: barColor,
                        transition: 'width 0.4s ease, background 0.3s ease',
                    }}
                />
            </div>
        </div>
    );
}

/* ─── Create Modal ─── */
function CreateModal({
    onClose,
    onCreated,
    eventId,
    maxSaleEndsAt,
    rateSource,
}: {
    onClose: () => void;
    onCreated: () => void;
    eventId: string;
    maxSaleEndsAt: string;
    rateSource?: string;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(TicketTypeToCreateSchema),
        defaultValues: {
            name: '',
            description: '',
            price: '' as unknown as number,
            currency: 'USD' as const,
            totalQuantity: '' as unknown as number,
            saleStartsAt: '',
            saleEndsAt: '',
        },
    });

    const [apiError, setApiError] = useState<string | null>(null);

    const onSubmit = async (data: Record<string, unknown>) => {
        try {
            setApiError(null);
            const payload = {
                ...data,
                saleStartsAt: data.saleStartsAt
                    ? new Date(String(data.saleStartsAt)).toISOString()
                    : undefined,
                saleEndsAt: data.saleEndsAt
                    ? new Date(String(data.saleEndsAt)).toISOString()
                    : undefined,
            } as Parameters<typeof ticketTypeService.create>[1];

            await ticketTypeService.create(eventId, payload);
            onCreated();
        } catch (err) {
            setApiError(getApiError(err));
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
                <h3>Nuevo Tipo de Entrada</h3>
                <p style={{ marginBottom: 18 }}>Define los detalles del nuevo tipo de entrada.</p>

                {apiError && (
                    <div
                        style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            padding: '10px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            marginBottom: 14,
                        }}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 6 }} />
                        {apiError}
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        void handleSubmit(onSubmit)(e);
                    }}
                >
                    <div className="field">
                        <label className="field-label">Nombre *</label>
                        <input
                            className="input"
                            {...register('name')}
                            placeholder="Ej: General, VIP, Preventa..."
                        />
                        {errors.name && (
                            <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                {errors.name.message as string}
                            </span>
                        )}
                    </div>
                    <div className="field">
                        <label className="field-label">Descripción</label>
                        <textarea
                            className="textarea"
                            {...register('description')}
                            placeholder="Descripción opcional..."
                            rows={2}
                        />
                    </div>
                    <div className="field">
                        <label className="field-label">
                            Precio (
                            {rateSource === 'EUR_BCV'
                                ? 'EUR'
                                : rateSource === 'USDT_PARALELO'
                                  ? 'USDT'
                                  : 'USD'}
                            ) *
                        </label>
                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...register('price')}
                            placeholder="0.00"
                        />
                        {errors.price && (
                            <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                {errors.price.message as string}
                            </span>
                        )}
                    </div>
                    <div className="field">
                        <label className="field-label">Cantidad Total *</label>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            {...register('totalQuantity')}
                            placeholder="Ej: 100"
                        />
                        {errors.totalQuantity && (
                            <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                {errors.totalQuantity.message as string}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="field">
                            <label className="field-label">Inicio de Venta</label>
                            <input
                                className="input"
                                type="datetime-local"
                                {...register('saleStartsAt')}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">Fin de Venta</label>
                            <input
                                className="input"
                                type="datetime-local"
                                max={maxSaleEndsAt}
                                {...register('saleEndsAt')}
                            />
                            {errors.saleEndsAt && (
                                <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                    {errors.saleEndsAt.message as string}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Creando...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPlus} /> Crear Tipo
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Edit Modal ─── */
function EditModal({
    onClose,
    onUpdated,
    eventId,
    ticketType,
    maxSaleEndsAt,
    rateSource,
}: {
    onClose: () => void;
    onUpdated: () => void;
    eventId: string;
    ticketType: TicketTypeType;
    maxSaleEndsAt: string;
    rateSource?: string;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(TicketTypeToUpdateSchema),
        defaultValues: {
            name: ticketType.name,
            description: ticketType.description,
            price: ticketType.usdPrice,
            currency: ticketType.currency,
            totalQuantity: ticketType.totalQuantity,
            saleStartsAt: toDateTimeLocal(ticketType.saleStartsAt),
            saleEndsAt: toDateTimeLocal(ticketType.saleEndsAt),
        },
    });

    const [apiError, setApiError] = useState<string | null>(null);

    const onSubmit = async (data: Record<string, unknown>) => {
        try {
            setApiError(null);
            const payload = {
                ...data,
                saleStartsAt: data.saleStartsAt
                    ? new Date(String(data.saleStartsAt)).toISOString()
                    : null,
                saleEndsAt: data.saleEndsAt
                    ? new Date(String(data.saleEndsAt)).toISOString()
                    : null,
            } as Parameters<typeof ticketTypeService.update>[2];

            await ticketTypeService.update(eventId, ticketType.id, payload);
            onUpdated();
        } catch (err) {
            setApiError(getApiError(err));
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
                <h3>Editar Tipo de Entrada</h3>
                <p style={{ marginBottom: 18 }}>
                    Modifica los datos del tipo de entrada &ldquo;{ticketType.name}&rdquo;.
                </p>

                {apiError && (
                    <div
                        style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            padding: '10px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            marginBottom: 14,
                        }}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 6 }} />
                        {apiError}
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        void handleSubmit(onSubmit)(e);
                    }}
                >
                    <div className="field">
                        <label className="field-label">Nombre</label>
                        <input className="input" {...register('name')} />
                        {errors.name && (
                            <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                {errors.name.message as string}
                            </span>
                        )}
                    </div>
                    <div className="field">
                        <label className="field-label">Descripción</label>
                        <textarea className="textarea" {...register('description')} rows={2} />
                    </div>
                    <div className="field">
                        <label className="field-label">
                            Precio (
                            {rateSource === 'EUR_BCV'
                                ? 'EUR'
                                : rateSource === 'USDT_PARALELO'
                                  ? 'USDT'
                                  : 'USD'}
                            ) *
                        </label>
                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...register('price')}
                        />
                        {errors.price && (
                            <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                {errors.price.message as string}
                            </span>
                        )}
                    </div>
                    <div className="field">
                        <label className="field-label">Cantidad Total</label>
                        <input
                            className="input"
                            type="number"
                            min={ticketType.soldQuantity}
                            {...register('totalQuantity')}
                        />
                        <span className="field-hint">
                            Mínimo permitido: {ticketType.soldQuantity} (entradas ya vendidas)
                        </span>
                        {errors.totalQuantity && (
                            <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                {errors.totalQuantity.message as string}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="field">
                            <label className="field-label">Inicio de Venta</label>
                            <input
                                className="input"
                                type="datetime-local"
                                {...register('saleStartsAt')}
                            />
                        </div>
                        <div className="field">
                            <label className="field-label">Fin de Venta</label>
                            <input
                                className="input"
                                type="datetime-local"
                                max={maxSaleEndsAt}
                                {...register('saleEndsAt')}
                            />
                            {errors.saleEndsAt && (
                                <span className="field-hint" style={{ color: 'var(--danger)' }}>
                                    {errors.saleEndsAt.message as string}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Guardando...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faEdit} /> Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Confirm Toggle Modal ─── */
function ConfirmToggleModal({
    ticketType,
    onClose,
    onConfirmed,
    eventId,
}: {
    ticketType: TicketTypeType;
    onClose: () => void;
    onConfirmed: () => void;
    eventId: string;
}) {
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const willDeactivate = ticketType.isActive;

    const handleConfirm = async () => {
        setLoading(true);
        setApiError(null);
        try {
            if (willDeactivate) {
                await ticketTypeService.deactivate(eventId, ticketType.id);
            } else {
                await ticketTypeService.update(eventId, ticketType.id, {
                    isActive: true,
                    saleStartsAt: ticketType.saleStartsAt,
                    saleEndsAt: ticketType.saleEndsAt,
                });
            }
            onConfirmed();
        } catch (err) {
            setApiError(getApiError(err));
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
                <h3>
                    {willDeactivate ? 'Deshabilitar Tipo de Entrada' : 'Reactivar Tipo de Entrada'}
                </h3>
                <p style={{ marginBottom: 6 }}>
                    {willDeactivate
                        ? `¿Deseas deshabilitar "${ticketType.name}"? No aparecerá como disponible para la venta, pero conservará su historial. Podrás reactivarlo en cualquier momento.`
                        : `¿Deseas reactivar "${ticketType.name}"? Volverá a estar disponible para la venta.`}
                </p>

                {apiError && (
                    <div
                        style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            padding: '10px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            marginTop: 12,
                        }}
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 6 }} />
                        {apiError}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        className={willDeactivate ? 'btn btn-danger' : 'btn btn-secondary'}
                        onClick={() => {
                            void handleConfirm();
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin /> Procesando...
                            </>
                        ) : willDeactivate ? (
                            <>
                                <FontAwesomeIcon icon={faBan} /> Deshabilitar
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCheckCircle} /> Reactivar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main page ─── */
export function TicketTypesPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { currentEvent } = useEvent();

    const [state, dispatch] = useReducer(pageReducer, {
        ticketTypes: [],
        maxCapacity: currentEvent?.maxCapacity ?? 0,
        totalAssigned: 0,
        isLoading: true,
        error: null,
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTicketType, setEditingTicketType] = useState<TicketTypeType | null>(null);
    const [togglingTicketType, setTogglingTicketType] = useState<TicketTypeType | null>(null);

    const fetchTicketTypes = useCallback(async () => {
        if (!eventId) return;
        dispatch({ type: 'LOADING' });
        try {
            const result = await ticketTypeService.list(eventId);
            dispatch({
                type: 'SUCCESS',
                ticketTypes: result.ticketTypes,
                maxCapacity: result.maxCapacity,
                totalAssigned: result.totalAssigned,
            });
        } catch (err) {
            dispatch({ type: 'ERROR', message: getApiError(err) });
        }
    }, [eventId]);

    useEffect(() => {
        void fetchTicketTypes();
    }, [fetchTicketTypes]);

    const handleCreated = () => {
        setShowCreateModal(false);
        void fetchTicketTypes();
    };

    const handleUpdated = () => {
        setEditingTicketType(null);
        void fetchTicketTypes();
    };

    const handleToggled = () => {
        setTogglingTicketType(null);
        void fetchTicketTypes();
    };

    /* ─── Loading ─── */
    if (state.isLoading && state.ticketTypes.length === 0) {
        return (
            <div
                style={{
                    height: '50vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    size="2x"
                    style={{ color: 'var(--primary)', marginBottom: 14 }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Cargando tipos de entrada...
                </p>
            </div>
        );
    }

    /* ─── Error ─── */
    if (state.error && state.ticketTypes.length === 0) {
        return (
            <div
                className="card"
                style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-lg)',
                    maxWidth: 500,
                    margin: '40px auto',
                    border: '1px solid var(--border)',
                }}
            >
                <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    size="2x"
                    style={{ color: 'var(--danger)', marginBottom: 14 }}
                />
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Error</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{state.error}</p>
                <button
                    className="btn btn-primary"
                    style={{ marginTop: 18 }}
                    onClick={() => void fetchTicketTypes()}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            margin: 0,
                            fontFamily: 'var(--font-sans)',
                        }}
                    >
                        Tipos de Entrada
                    </h2>
                    <p
                        style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            margin: '4px 0 0',
                        }}
                    >
                        Gestiona los distintos tipos de entrada para este evento.
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    id="btn-create-ticket-type"
                >
                    <FontAwesomeIcon icon={faPlus} /> Nuevo Tipo
                </button>
            </div>

            {/* Capacity Bar */}
            <CapacityBar maxCapacity={state.maxCapacity} totalAssigned={state.totalAssigned} />

            {/* Empty state */}
            {state.ticketTypes.length === 0 ? (
                <div
                    className="card elevated"
                    style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 300,
                    }}
                >
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            marginBottom: 20,
                            fontSize: 28,
                        }}
                    >
                        <FontAwesomeIcon icon={faBoxOpen} />
                    </div>
                    <h3
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 8,
                            color: 'var(--text-primary)',
                        }}
                    >
                        Sin tipos de entrada
                    </h3>
                    <p
                        style={{
                            color: 'var(--text-secondary)',
                            fontSize: 14,
                            maxWidth: 380,
                            marginBottom: 20,
                            lineHeight: 1.5,
                        }}
                    >
                        Aún no has creado ningún tipo de entrada. Crea el primero para comenzar a
                        gestionar la venta de entradas del evento.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <FontAwesomeIcon icon={faPlus} /> Crear Primer Tipo
                    </button>
                </div>
            ) : (
                /* Table */
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Total</th>
                                <th>Vendidas</th>
                                <th>Disponibles</th>
                                <th>Ventana de Venta</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.ticketTypes.map((tt) => (
                                <tr key={tt.id} style={{ opacity: tt.isActive ? 1 : 0.55 }}>
                                    <td>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 13.5,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {tt.name}
                                        </div>
                                        {tt.description && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: 'var(--text-secondary)',
                                                    marginTop: 2,
                                                    maxWidth: 200,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {tt.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 13,
                                            }}
                                        >
                                            {currentEvent?.rateSource === 'EUR_BCV' ? (
                                                <>
                                                    € {tt.usdPrice.toFixed(2)}
                                                    {tt.currency === 'VES' && (
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: 'var(--text-secondary)',
                                                                fontWeight: 400,
                                                                marginLeft: 4,
                                                            }}
                                                        >
                                                            (~ {formatPrice(tt.price, 'VES')})
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    $ {tt.usdPrice.toFixed(2)}
                                                    {tt.currency === 'VES' && (
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                color: 'var(--text-secondary)',
                                                                fontWeight: 400,
                                                                marginLeft: 4,
                                                            }}
                                                        >
                                                            (~ {formatPrice(tt.price, 'VES')})
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                        {tt.totalQuantity}
                                    </td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                        {tt.soldQuantity}
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600,
                                                color:
                                                    tt.availableQuantity > 0
                                                        ? 'var(--success)'
                                                        : 'var(--danger)',
                                            }}
                                        >
                                            {tt.availableQuantity}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12.5 }}>
                                        {tt.saleStartsAt || tt.saleEndsAt ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                }}
                                            >
                                                <span>{formatDate(tt.saleStartsAt)}</span>
                                                <span style={{ color: 'var(--text-disabled)' }}>
                                                    →
                                                </span>
                                                <span>{formatDate(tt.saleEndsAt)}</span>
                                            </div>
                                        ) : (
                                            <span
                                                style={{
                                                    color: 'var(--text-disabled)',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                Sin restricción
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {tt.isActive ? (
                                            <span className="badge success dot">Activo</span>
                                        ) : (
                                            <span className="badge default dot">Inactivo</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 6,
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                title="Editar"
                                                onClick={() => setEditingTicketType(tt)}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button
                                                className={`btn btn-sm ${tt.isActive ? 'btn-ghost' : 'btn-secondary'}`}
                                                title={tt.isActive ? 'Deshabilitar' : 'Reactivar'}
                                                onClick={() => setTogglingTicketType(tt)}
                                                style={
                                                    tt.isActive ? { color: 'var(--danger)' } : {}
                                                }
                                            >
                                                <FontAwesomeIcon
                                                    icon={tt.isActive ? faBan : faCheckCircle}
                                                />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary footer */}
            {state.ticketTypes.length > 0 && (
                <div
                    style={{
                        marginTop: 16,
                        padding: '10px 16px',
                        background: 'var(--bg-surface)',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                    }}
                >
                    <FontAwesomeIcon icon={faTicketAlt} style={{ color: 'var(--primary)' }} />
                    <span>
                        {state.ticketTypes.length} tipo{state.ticketTypes.length !== 1 ? 's' : ''}{' '}
                        de entrada &nbsp;·&nbsp;{' '}
                        {state.ticketTypes.filter((t) => t.isActive).length} activo
                        {state.ticketTypes.filter((t) => t.isActive).length !== 1 ? 's' : ''}
                        &nbsp;·&nbsp; {state.ticketTypes.reduce(
                            (s, t) => s + t.soldQuantity,
                            0,
                        )}{' '}
                        entradas vendidas en total
                    </span>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && eventId && (
                <CreateModal
                    eventId={eventId}
                    maxSaleEndsAt={toDateTimeLocal(currentEvent?.endTime as string)}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreated}
                    rateSource={currentEvent?.rateSource}
                />
            )}
            {editingTicketType && eventId && (
                <EditModal
                    eventId={eventId}
                    ticketType={editingTicketType}
                    maxSaleEndsAt={toDateTimeLocal(currentEvent?.endTime as string)}
                    onClose={() => setEditingTicketType(null)}
                    onUpdated={handleUpdated}
                    rateSource={currentEvent?.rateSource}
                />
            )}
            {togglingTicketType && eventId && (
                <ConfirmToggleModal
                    eventId={eventId}
                    ticketType={togglingTicketType}
                    onClose={() => setTogglingTicketType(null)}
                    onConfirmed={handleToggled}
                />
            )}
        </div>
    );
}

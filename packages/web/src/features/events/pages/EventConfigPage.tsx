import {
    EventToUpdateSchema,
    EventToUpdateType,
    PaymentMethodToCreateSchema,
    PaymentMethodToCreateType,
    PaymentMethodToUpdateSchema,
    PaymentMethodToUpdateType,
    ExchangeRateToCreateSchema,
    ExchangeRateToCreateType,
    PaymentMethodType,
    ExchangeRateType,
} from '@eventflow/shared';
import {
    faCog,
    faCreditCard,
    faExchangeAlt,
    faSpinner,
    faExclamationTriangle,
    faPlus,
    faEdit,
    faBan,
    faCheckCircle,
    faBoxOpen,
    faSave,
    faHistory,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { eventService } from '../services/eventService';
import { exchangeRateService } from '../services/exchangeRateService';
import { paymentMethodService } from '../services/paymentMethodService';

/* ─── Helpers ─── */
const toDateInputValue = (val: Date | string | undefined): string => {
    if (!val) return '';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

const toTimeInputValue = (val: Date | string | undefined): string => {
    if (!val) return '';
    try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().substring(11, 16);
    } catch {
        return '';
    }
};

const getApiErrorMessage = (err: unknown): string =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    'Ocurrió un error inesperado.';

/* ─── Tab types ─── */
type Tab = 'general' | 'payment-methods' | 'exchange-rate';

/* ─── Payment methods state ─── */
interface PMState {
    methods: PaymentMethodType[];
    isLoading: boolean;
    error: string | null;
}
type PMAction =
    | { type: 'LOADING' }
    | { type: 'SUCCESS'; methods: PaymentMethodType[] }
    | { type: 'ERROR'; message: string };

function pmReducer(_state: PMState, action: PMAction): PMState {
    switch (action.type) {
        case 'LOADING':
            return { ..._state, isLoading: true, error: null };
        case 'SUCCESS':
            return { methods: action.methods, isLoading: false, error: null };
        case 'ERROR':
            return { ..._state, isLoading: false, error: action.message };
    }
}

/* ─── Exchange rate state ─── */
interface ERState {
    current: ExchangeRateType | null;
    history: ExchangeRateType[];
    isLoading: boolean;
    isHistoryLoading: boolean;
    error: string | null;
}
type ERAction =
    | { type: 'LOADING' }
    | { type: 'CURRENT_SUCCESS'; current: ExchangeRateType | null }
    | { type: 'HISTORY_LOADING' }
    | { type: 'HISTORY_SUCCESS'; history: ExchangeRateType[] }
    | { type: 'ERROR'; message: string };

function erReducer(state: ERState, action: ERAction): ERState {
    switch (action.type) {
        case 'LOADING':
            return { ...state, isLoading: true, error: null };
        case 'CURRENT_SUCCESS':
            return { ...state, current: action.current, isLoading: false, error: null };
        case 'HISTORY_LOADING':
            return { ...state, isHistoryLoading: true };
        case 'HISTORY_SUCCESS':
            return { ...state, history: action.history, isHistoryLoading: false };
        case 'ERROR':
            return { ...state, isLoading: false, error: action.message };
    }
}

/* ═══════════════════════════════════════════ GENERAL TAB ═══════════════════════════════════════════ */
function GeneralTab({ eventId }: { eventId: string }) {
    const { currentEvent, setEventContext, eventRole } = useEvent();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(EventToUpdateSchema),
        defaultValues: {
            name: currentEvent?.name ?? '',
            description: currentEvent?.description ?? '',
            startDate: toDateInputValue(currentEvent?.startDate),
            endDate: toDateInputValue(currentEvent?.endDate),
            startTime: toTimeInputValue(currentEvent?.startTime),
            endTime: toTimeInputValue(currentEvent?.endTime),
            location: currentEvent?.location ?? '',
            address: currentEvent?.address ?? '',
            maxCapacity: currentEvent?.maxCapacity ?? 0,
            imageUrl: currentEvent?.imageUrl ?? '',
        },
    });

    const onSubmit = async (data: EventToUpdateType) => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            const startDateStr = data.startDate ?? toDateInputValue(currentEvent?.startDate);
            const endDateStr = data.endDate ?? toDateInputValue(currentEvent?.endDate);
            const startTimeStr = data.startTime ?? toTimeInputValue(currentEvent?.startTime);
            const endTimeStr = data.endTime ?? toTimeInputValue(currentEvent?.endTime);

            const payload: EventToUpdateType = {
                ...data,
                startDate: startDateStr
                    ? new Date(`${startDateStr}T12:00:00`).toISOString()
                    : undefined,
                endDate: endDateStr ? new Date(`${endDateStr}T12:00:00`).toISOString() : undefined,
                startTime:
                    startDateStr && startTimeStr
                        ? new Date(`${startDateStr}T${startTimeStr}:00`).toISOString()
                        : undefined,
                endTime:
                    endDateStr && endTimeStr
                        ? new Date(`${endDateStr}T${endTimeStr}:00`).toISOString()
                        : undefined,
            };

            const updated = await eventService.updateEvent(eventId, payload);
            setEventContext(updated, eventRole);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setSaveError(getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 14,
        fontFamily: 'var(--font-sans)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: 4,
    };

    const errorStyle: React.CSSProperties = {
        color: 'var(--danger)',
        fontSize: 12,
        marginTop: 4,
    };

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(onSubmit)(e);
            }}
            style={{ maxWidth: 700 }}
        >
            {saveError && (
                <div
                    style={{
                        padding: '10px 14px',
                        background: 'var(--danger-light)',
                        border: '1px solid var(--danger)',
                        borderRadius: 8,
                        color: 'var(--danger)',
                        fontSize: 13,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {saveError}
                </div>
            )}
            {saveSuccess && (
                <div
                    style={{
                        padding: '10px 14px',
                        background: 'var(--success-light)',
                        border: '1px solid var(--success)',
                        borderRadius: 8,
                        color: 'var(--success)',
                        fontSize: 13,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Configuración guardada correctamente.
                </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
                {/* Nombre */}
                <div>
                    <label style={labelStyle}>Nombre del evento</label>
                    <input {...register('name')} style={fieldStyle} />
                    {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
                </div>

                {/* Descripción */}
                <div>
                    <label style={labelStyle}>Descripción</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        style={{ ...fieldStyle, resize: 'vertical' }}
                    />
                    {errors.description && <p style={errorStyle}>{errors.description.message}</p>}
                </div>

                {/* Fechas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Fecha de inicio</label>
                        <input {...register('startDate')} type="date" style={fieldStyle} />
                        {errors.startDate && <p style={errorStyle}>{errors.startDate.message}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha de fin</label>
                        <input {...register('endDate')} type="date" style={fieldStyle} />
                        {errors.endDate && <p style={errorStyle}>{errors.endDate.message}</p>}
                    </div>
                </div>

                {/* Horas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Hora de inicio</label>
                        <input {...register('startTime')} type="time" style={fieldStyle} />
                        {errors.startTime && <p style={errorStyle}>{errors.startTime.message}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Hora de finalización</label>
                        <input {...register('endTime')} type="time" style={fieldStyle} />
                        {errors.endTime && <p style={errorStyle}>{errors.endTime.message}</p>}
                    </div>
                </div>

                {/* Ubicación */}
                <div>
                    <label style={labelStyle}>Ubicación</label>
                    <input {...register('location')} style={fieldStyle} />
                    {errors.location && <p style={errorStyle}>{errors.location.message}</p>}
                </div>

                {/* Dirección */}
                <div>
                    <label style={labelStyle}>Dirección</label>
                    <input {...register('address')} style={fieldStyle} />
                    {errors.address && <p style={errorStyle}>{errors.address.message}</p>}
                </div>

                {/* Capacidad máxima */}
                <div>
                    <label style={labelStyle}>Capacidad máxima</label>
                    <input {...register('maxCapacity')} type="number" min={1} style={fieldStyle} />
                    {errors.maxCapacity && <p style={errorStyle}>{errors.maxCapacity.message}</p>}
                </div>

                {/* Imagen */}
                <div>
                    <label style={labelStyle}>URL de imagen (opcional)</label>
                    <input {...register('imageUrl')} style={fieldStyle} />
                    {errors.imageUrl && <p style={errorStyle}>{errors.imageUrl.message}</p>}
                </div>
            </div>

            <div style={{ marginTop: 24 }}>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    {isSaving ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                        <FontAwesomeIcon icon={faSave} />
                    )}
                    Guardar cambios
                </button>
            </div>
        </form>
    );
}

/* ═══════════════════════════════════════════ PAYMENT METHODS TAB ═══════════════════════════════════════════ */

interface PMModalProps {
    eventId: string;
    onClose: () => void;
    onSaved: () => void;
    existing?: PaymentMethodType;
}

function PaymentMethodModal({ eventId, onClose, onSaved, existing }: PMModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(existing ? PaymentMethodToUpdateSchema : PaymentMethodToCreateSchema),
        defaultValues: {
            name: existing?.name ?? '',
            details: existing?.details ?? '',
            currency: existing?.currency ?? 'USD',
            isActive: existing?.isActive ?? true,
        },
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = async (data: any) => {
        setIsSaving(true);
        setSaveError(null);
        try {
            if (existing) {
                await paymentMethodService.update(
                    eventId,
                    existing.id,
                    data as PaymentMethodToUpdateType,
                );
            } else {
                await paymentMethodService.create(eventId, data as PaymentMethodToCreateType);
            }
            onSaved();
            onClose();
        } catch (err) {
            setSaveError(getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 14,
        fontFamily: 'var(--font-sans)',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-lg)',
                    padding: 28,
                    width: '100%',
                    maxWidth: 480,
                    boxShadow: 'var(--shadow-md)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 20,
                    }}
                >
                    {existing ? 'Editar método de pago' : 'Nuevo método de pago'}
                </h3>

                {saveError && (
                    <div
                        style={{
                            padding: '8px 12px',
                            background: 'var(--danger-light)',
                            border: '1px solid var(--danger)',
                            borderRadius: 8,
                            color: 'var(--danger)',
                            fontSize: 13,
                            marginBottom: 14,
                        }}
                    >
                        {saveError}
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        void handleSubmit(onSubmit)(e);
                    }}
                    style={{ display: 'grid', gap: 14 }}
                >
                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginBottom: 4,
                            }}
                        >
                            Nombre (ej. &quot;Pago Móvil Banesco&quot;)
                        </label>
                        <input {...register('name')} style={fieldStyle} />
                        {errors.name && (
                            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginBottom: 4,
                            }}
                        >
                            Datos de cobro (número, correo, teléfono…)
                        </label>
                        <textarea
                            {...register('details')}
                            rows={3}
                            style={{ ...fieldStyle, resize: 'vertical' }}
                        />
                        {errors.details && (
                            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                                {errors.details.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginBottom: 4,
                            }}
                        >
                            Moneda
                        </label>
                        <select {...register('currency')} style={fieldStyle}>
                            <option value="USD">USD</option>
                            <option value="VES">VES (Bolívares)</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 10,
                            marginTop: 8,
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        >
                            {isSaving && <FontAwesomeIcon icon={faSpinner} spin />}
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface DisableConfirmModalProps {
    method: PaymentMethodType;
    eventId: string;
    onClose: () => void;
    onDisabled: () => void;
}

function DisableConfirmModal({ method, eventId, onClose, onDisabled }: DisableConfirmModalProps) {
    const [isDisabling, setIsDisabling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDisable = async () => {
        setIsDisabling(true);
        setError(null);
        try {
            await paymentMethodService.disable(eventId, method.id);
            onDisabled();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setIsDisabling(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-lg)',
                    padding: 28,
                    width: '100%',
                    maxWidth: 420,
                    boxShadow: 'var(--shadow-md)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 10,
                    }}
                >
                    Deshabilitar método de pago
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                    ¿Deseas deshabilitar <strong>{method.name}</strong>? El método no será visible
                    para nuevas ventas pero se conserva en el historial.
                </p>
                {error && (
                    <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>
                        {error}
                    </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={isDisabling}>
                        Cancelar
                    </button>
                    <button
                        className="btn"
                        style={{ background: 'var(--danger)', color: '#fff' }}
                        onClick={() => {
                            void handleDisable();
                        }}
                        disabled={isDisabling}
                    >
                        {isDisabling ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Deshabilitar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PaymentMethodsTab({ eventId }: { eventId: string }) {
    const [state, dispatch] = useReducer(pmReducer, {
        methods: [],
        isLoading: true,
        error: null,
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethodType | null>(null);
    const [disablingMethod, setDisablingMethod] = useState<PaymentMethodType | null>(null);

    const fetchMethods = useCallback(async () => {
        dispatch({ type: 'LOADING' });
        try {
            const methods = await paymentMethodService.list(eventId);
            dispatch({ type: 'SUCCESS', methods });
        } catch (err) {
            dispatch({ type: 'ERROR', message: getApiErrorMessage(err) });
        }
    }, [eventId]);

    useEffect(() => {
        void fetchMethods();
    }, [fetchMethods]);

    const currencyBadgeColor = (currency: string) => {
        if (currency === 'USD') return { bg: '#dbeafe', color: '#1d4ed8' };
        if (currency === 'EUR') return { bg: '#ede9fe', color: '#7c3aed' };
        return { bg: '#dcfce7', color: '#15803d' };
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Gestiona los métodos de pago aceptados para este evento.
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    Nuevo método
                </button>
            </div>

            {state.isLoading && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        size="2x"
                        style={{ color: 'var(--primary)' }}
                    />
                </div>
            )}

            {state.error && (
                <div
                    style={{
                        padding: '10px 14px',
                        background: 'var(--danger-light)',
                        border: '1px solid var(--danger)',
                        borderRadius: 8,
                        color: 'var(--danger)',
                        fontSize: 13,
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8 }} />
                    {state.error}
                </div>
            )}

            {!state.isLoading && !state.error && state.methods.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <FontAwesomeIcon
                        icon={faBoxOpen}
                        size="3x"
                        style={{ marginBottom: 12, opacity: 0.4 }}
                    />
                    <p style={{ fontSize: 14 }}>No hay métodos de pago configurados.</p>
                </div>
            )}

            {!state.isLoading && !state.error && state.methods.length > 0 && (
                <div style={{ display: 'grid', gap: 12 }}>
                    {state.methods.map((method) => {
                        const badge = currencyBadgeColor(method.currency);
                        return (
                            <div
                                key={method.id}
                                style={{
                                    background: method.isActive
                                        ? 'var(--bg-elevated)'
                                        : 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 10,
                                    padding: '14px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    opacity: method.isActive ? 1 : 0.7,
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 14,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {method.name}
                                        </span>
                                        <span
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                background: badge.bg,
                                                color: badge.color,
                                            }}
                                        >
                                            {method.currency}
                                        </span>
                                        {!method.isActive && (
                                            <span
                                                style={{
                                                    padding: '2px 8px',
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background: 'var(--bg-base)',
                                                    color: 'var(--text-disabled)',
                                                    border: '1px solid var(--border)',
                                                }}
                                            >
                                                Deshabilitado
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            color: 'var(--text-secondary)',
                                            margin: 0,
                                            whiteSpace: 'pre-line',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {method.details}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '6px 10px', fontSize: 13 }}
                                        onClick={() => setEditingMethod(method)}
                                        title="Editar"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    {method.isActive && (
                                        <button
                                            className="btn"
                                            style={{
                                                padding: '6px 10px',
                                                fontSize: 13,
                                                background: 'var(--danger-light)',
                                                color: 'var(--danger)',
                                                border: '1px solid var(--danger)',
                                            }}
                                            onClick={() => setDisablingMethod(method)}
                                            title="Deshabilitar"
                                        >
                                            <FontAwesomeIcon icon={faBan} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreateModal && (
                <PaymentMethodModal
                    eventId={eventId}
                    onClose={() => setShowCreateModal(false)}
                    onSaved={() => {
                        void fetchMethods();
                    }}
                />
            )}
            {editingMethod && (
                <PaymentMethodModal
                    eventId={eventId}
                    existing={editingMethod}
                    onClose={() => setEditingMethod(null)}
                    onSaved={() => {
                        void fetchMethods();
                    }}
                />
            )}
            {disablingMethod && (
                <DisableConfirmModal
                    method={disablingMethod}
                    eventId={eventId}
                    onClose={() => setDisablingMethod(null)}
                    onDisabled={() => {
                        void fetchMethods();
                    }}
                />
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════ EXCHANGE RATE TAB ═══════════════════════════════════════════ */
function ExchangeRateTab({ eventId }: { eventId: string }) {
    const [state, dispatch] = useReducer(erReducer, {
        current: null,
        history: [],
        isLoading: true,
        isHistoryLoading: false,
        error: null,
    });
    const [showHistory, setShowHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(ExchangeRateToCreateSchema),
        defaultValues: { rate: undefined },
    });

    const fetchCurrent = useCallback(async () => {
        dispatch({ type: 'LOADING' });
        try {
            const { current } = await exchangeRateService.getCurrent(eventId);
            dispatch({ type: 'CURRENT_SUCCESS', current });
        } catch (err) {
            dispatch({ type: 'ERROR', message: getApiErrorMessage(err) });
        }
    }, [eventId]);

    const fetchHistory = useCallback(async () => {
        dispatch({ type: 'HISTORY_LOADING' });
        try {
            const history = await exchangeRateService.list(eventId);
            dispatch({ type: 'HISTORY_SUCCESS', history });
        } catch {
            dispatch({ type: 'HISTORY_SUCCESS', history: [] });
        }
    }, [eventId]);

    useEffect(() => {
        void fetchCurrent();
    }, [fetchCurrent]);

    useEffect(() => {
        if (showHistory) void fetchHistory();
    }, [showHistory, fetchHistory]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);
        try {
            await exchangeRateService.create(eventId, data as ExchangeRateToCreateType);
            reset();
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 3000);
            void fetchCurrent();
            if (showHistory) void fetchHistory();
        } catch (err) {
            setSubmitError(getApiErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <div style={{ maxWidth: 600 }}>
            {/* Tasa vigente */}
            <div
                style={{
                    background: state.current
                        ? 'var(--secondary-light, #e6f4f1)'
                        : 'var(--bg-surface)',
                    border: `1px solid ${state.current ? 'var(--secondary)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 24,
                }}
            >
                <p
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: 'var(--text-secondary)',
                        marginBottom: 6,
                    }}
                >
                    Tasa vigente
                </p>
                {state.isLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: 'var(--primary)' }} />
                ) : state.current ? (
                    <>
                        <p
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                color: 'var(--secondary)',
                                margin: 0,
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            {state.current.rate.toLocaleString('es-VE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            <span
                                style={{
                                    fontSize: 16,
                                    fontWeight: 400,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Bs / $
                            </span>
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                            Registrada el {formatDate(state.current.effectiveAt)} por{' '}
                            <strong>{state.current.setByName}</strong>
                        </p>
                    </>
                ) : (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                        Sin tasa registrada para este evento.
                    </p>
                )}
            </div>

            {/* Registrar nueva tasa */}
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    marginBottom: 24,
                }}
            >
                <h4
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 14,
                    }}
                >
                    Registrar nueva tasa
                </h4>

                {submitError && (
                    <div
                        style={{
                            padding: '8px 12px',
                            background: 'var(--danger-light)',
                            border: '1px solid var(--danger)',
                            borderRadius: 8,
                            color: 'var(--danger)',
                            fontSize: 13,
                            marginBottom: 12,
                        }}
                    >
                        {submitError}
                    </div>
                )}
                {submitSuccess && (
                    <div
                        style={{
                            padding: '8px 12px',
                            background: 'var(--success-light)',
                            border: '1px solid var(--success)',
                            borderRadius: 8,
                            color: 'var(--success)',
                            fontSize: 13,
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Tasa registrada correctamente.
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        void handleSubmit(onSubmit)(e);
                    }}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
                >
                    <div style={{ flex: 1 }}>
                        <input
                            {...register('rate')}
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Ej. 42.50"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                fontSize: 14,
                                fontFamily: 'var(--font-mono)',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                boxSizing: 'border-box',
                            }}
                        />
                        {errors.rate && (
                            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                                {errors.rate.message}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {isSubmitting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                            <FontAwesomeIcon icon={faPlus} />
                        )}
                        Registrar tasa
                    </button>
                </form>
            </div>

            {/* Historial */}
            <button
                className="btn btn-secondary"
                onClick={() => setShowHistory((v) => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}
            >
                <FontAwesomeIcon icon={faHistory} />
                {showHistory ? 'Ocultar historial' : 'Ver historial de tasas'}
            </button>

            {showHistory && (
                <div
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    {state.isHistoryLoading ? (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                style={{ color: 'var(--primary)' }}
                            />
                        </div>
                    ) : state.history.length === 0 ? (
                        <p
                            style={{
                                textAlign: 'center',
                                padding: 24,
                                color: 'var(--text-secondary)',
                                fontSize: 14,
                            }}
                        >
                            Sin historial disponible.
                        </p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr
                                    style={{
                                        background: 'var(--bg-surface)',
                                        borderBottom: '1px solid var(--border)',
                                    }}
                                >
                                    <th
                                        style={{
                                            padding: '10px 16px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Tasa (Bs/$)
                                    </th>
                                    <th
                                        style={{
                                            padding: '10px 16px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Fecha
                                    </th>
                                    <th
                                        style={{
                                            padding: '10px 16px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        Registrado por
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.history.map((er, i) => (
                                    <tr
                                        key={er.id}
                                        style={{
                                            borderBottom:
                                                i < state.history.length - 1
                                                    ? '1px solid var(--border)'
                                                    : 'none',
                                            background: i === 0 ? 'var(--bg-surface)' : undefined,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '10px 16px',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: i === 0 ? 700 : 400,
                                                color:
                                                    i === 0
                                                        ? 'var(--secondary)'
                                                        : 'var(--text-primary)',
                                            }}
                                        >
                                            {er.rate.toLocaleString('es-VE', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                            {i === 0 && (
                                                <span
                                                    style={{
                                                        marginLeft: 8,
                                                        fontSize: 11,
                                                        fontFamily: 'var(--font-sans)',
                                                        background:
                                                            'var(--secondary-light, #e6f4f1)',
                                                        color: 'var(--secondary)',
                                                        padding: '1px 6px',
                                                        borderRadius: 10,
                                                    }}
                                                >
                                                    vigente
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 16px',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {formatDate(er.effectiveAt)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 16px',
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {er.setByName}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════ MAIN PAGE ═══════════════════════════════════════════ */
export function EventConfigPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [activeTab, setActiveTab] = useState<Tab>('general');

    if (!eventId) return null;

    const tabs: { id: Tab; label: string; icon: typeof faCog }[] = [
        { id: 'general', label: 'General', icon: faCog },
        { id: 'payment-methods', label: 'Métodos de pago', icon: faCreditCard },
        { id: 'exchange-rate', label: 'Tasa de cambio', icon: faExchangeAlt },
    ];

    return (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2
                    style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 4,
                    }}
                >
                    Configuración del Evento
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Gestiona los datos generales, métodos de pago y tasa de cambio del evento.
                </p>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: 4,
                    borderBottom: '2px solid var(--border)',
                    marginBottom: 28,
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 18px',
                            background: 'none',
                            border: 'none',
                            borderBottom:
                                activeTab === tab.id
                                    ? '2px solid var(--primary)'
                                    : '2px solid transparent',
                            marginBottom: -2,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            color:
                                activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'color 0.15s, border-color 0.15s',
                            fontFamily: 'var(--font-sans)',
                        }}
                    >
                        <FontAwesomeIcon icon={tab.icon} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'general' && <GeneralTab eventId={eventId} />}
                {activeTab === 'payment-methods' && <PaymentMethodsTab eventId={eventId} />}
                {activeTab === 'exchange-rate' && <ExchangeRateTab eventId={eventId} />}
            </div>
        </div>
    );
}

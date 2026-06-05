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
    BotConfigToUpsertSchema,
    BotConfigToUpsertType,
    BotConfig,
    BcvRateType,
    getEurUsdRate,
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
    faRobot,
    faPlug,
    faSync,
    faGlobe,
    faUser,
    faCoins,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { bcvService } from '../services/bcvService';
import { botConfigService } from '../services/botConfigService';
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
type Tab = 'general' | 'payment-methods' | 'exchange-rate' | 'bot-assistant';

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
            return {
                ...state,
                isLoading: false,
                isHistoryLoading: false,
                error: action.message,
            };
    }
}

/* ─── BCV rate state ─── */
type RateSource = 'USD_BCV' | 'EUR_BCV' | 'USDT_PARALELO' | 'CUSTOM';

interface BcvState {
    rate: BcvRateType | null;
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;
}
type BcvAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; rate: BcvRateType }
    | { type: 'FETCH_ERROR'; message: string }
    | { type: 'SYNC_START' }
    | { type: 'SYNC_SUCCESS'; rate: BcvRateType }
    | { type: 'SYNC_ERROR'; message: string };

function bcvReducer(state: BcvState, action: BcvAction): BcvState {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true };
        case 'FETCH_SUCCESS':
            return { ...state, rate: action.rate, isLoading: false };
        case 'FETCH_ERROR':
            return { ...state, error: action.message, isLoading: false };
        case 'SYNC_START':
            return { ...state, isSyncing: true, error: null };
        case 'SYNC_SUCCESS':
            return { ...state, rate: action.rate, isSyncing: false };
        case 'SYNC_ERROR':
            return { ...state, error: action.message, isSyncing: false };
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
    const { currentEvent, setEventContext, eventRole } = useEvent();
    const autoSyncEnabled = currentEvent?.rateSource !== 'CUSTOM';
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

    // BCV state
    const [bcvState, bcvDispatch] = useReducer(bcvReducer, {
        rate: null,
        isLoading: true,
        isSyncing: false,
        error: null,
    });
    const [isTogglingAutoSync, setIsTogglingAutoSync] = useState(false);
    const [selectedRateSource, setSelectedRateSource] = useState<RateSource>(
        (currentEvent?.rateSource as RateSource) ?? 'CUSTOM',
    );

    // Adjust selectedRateSource when currentEvent changes (render-time sync)
    const [prevEventId, setPrevEventId] = useState(currentEvent?.id);
    if (currentEvent && currentEvent.id !== prevEventId) {
        setPrevEventId(currentEvent.id);
        setSelectedRateSource((currentEvent.rateSource as RateSource) ?? 'CUSTOM');
    }

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
        } catch (err) {
            dispatch({ type: 'ERROR', message: getApiErrorMessage(err) });
        }
    }, [eventId]);

    const fetchBcvRate = useCallback(async () => {
        try {
            bcvDispatch({ type: 'FETCH_START' });
            const rate = await bcvService.getRate();
            bcvDispatch({ type: 'FETCH_SUCCESS', rate });
        } catch (err) {
            bcvDispatch({ type: 'FETCH_ERROR', message: getApiErrorMessage(err) });
        }
    }, []);

    useEffect(() => {
        void fetchCurrent();
        void fetchBcvRate();
    }, [fetchCurrent, fetchBcvRate]);

    useEffect(() => {
        if (showHistory) void fetchHistory();
    }, [showHistory, fetchHistory]);

    const handleBcvSync = async () => {
        bcvDispatch({ type: 'SYNC_START' });
        try {
            const rate = await bcvService.syncRate();
            bcvDispatch({ type: 'SYNC_SUCCESS', rate });
            // Refresh event exchange rate in case auto-sync kicked in
            void fetchCurrent();
            window.dispatchEvent(new Event('exchangeRateChanged'));
            if (showHistory) void fetchHistory();
        } catch (err) {
            bcvDispatch({ type: 'SYNC_ERROR', message: getApiErrorMessage(err) });
        }
    };

    const handleSaveRateSource = async () => {
        if (!currentEvent) return;
        setIsTogglingAutoSync(true);
        try {
            const updated = await eventService.updateEvent(eventId, {
                rateSource: selectedRateSource,
            });
            setEventContext(updated, eventRole);

            if (selectedRateSource !== 'CUSTOM') {
                await handleBcvSync();
            }
        } catch (err) {
            bcvDispatch({ type: 'SYNC_ERROR', message: getApiErrorMessage(err) });
        } finally {
            setIsTogglingAutoSync(false);
        }
    };

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
            window.dispatchEvent(new Event('exchangeRateChanged'));
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

    const formatAge = (ms: number) => {
        if (ms < 60000) return 'hace menos de 1 min';
        const mins = Math.floor(ms / 60000);
        if (mins < 60) return `hace ${mins} min`;
        const hours = Math.floor(mins / 60);
        return `hace ${hours}h ${mins % 60}min`;
    };

    return (
        <div style={{ maxWidth: 750 }}>
            {/* ── BCV Global Rate Card ── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: 14,
                    padding: '22px 26px',
                    marginBottom: 20,
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.15)',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 14,
                    }}
                >
                    <div>
                        <p
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 1.2,
                                color: '#94a3b8',
                                margin: 0,
                            }}
                        >
                            <FontAwesomeIcon icon={faGlobe} style={{ marginRight: 6 }} />
                            Tasas de Referencia Nacional
                        </p>
                    </div>
                    <button
                        className="btn"
                        onClick={() => {
                            void handleBcvSync();
                        }}
                        disabled={bcvState.isSyncing}
                        style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            padding: '5px 12px',
                            fontSize: 12,
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                        }}
                    >
                        <FontAwesomeIcon icon={faSync} spin={bcvState.isSyncing} />
                        Sincronizar
                    </button>
                </div>

                {bcvState.isLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#a5b4fc' }} />
                ) : bcvState.rate ? (
                    <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}
                    >
                        <div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>
                                USD (BCV)
                            </p>
                            <p
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    margin: 0,
                                }}
                            >
                                {bcvState.rate.usdRate.toLocaleString('es-VE', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 4,
                                })}
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 400,
                                        color: '#94a3b8',
                                        marginLeft: 4,
                                    }}
                                >
                                    Bs
                                </span>
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>
                                EUR (BCV)
                            </p>
                            <p
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    margin: 0,
                                }}
                            >
                                {bcvState.rate.eurRate.toLocaleString('es-VE', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 4,
                                })}
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 400,
                                        color: '#94a3b8',
                                        marginLeft: 4,
                                    }}
                                >
                                    Bs
                                </span>
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>
                                USDt (Paralelo)
                            </p>
                            <p
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    margin: 0,
                                }}
                            >
                                {bcvState.rate.usdtRate
                                    ? bcvState.rate.usdtRate.toLocaleString('es-VE', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 4,
                                      })
                                    : '—'}
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 400,
                                        color: '#94a3b8',
                                        marginLeft: 4,
                                    }}
                                >
                                    Bs
                                </span>
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px' }}>
                                EUR/USD
                            </p>
                            <p
                                style={{
                                    fontSize: 20,
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-mono)',
                                    margin: 0,
                                }}
                            >
                                {getEurUsdRate(
                                    bcvState.rate.eurRate,
                                    bcvState.rate.usdRate,
                                ).toLocaleString('es-VE', {
                                    minimumFractionDigits: 4,
                                    maximumFractionDigits: 4,
                                })}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                        {bcvState.error ?? 'No se pudo obtener las tasas de cambio.'}
                    </p>
                )}

                {bcvState.rate && (
                    <p
                        style={{
                            fontSize: 11,
                            color: '#64748b',
                            marginTop: 10,
                            margin: '10px 0 0',
                        }}
                    >
                        {bcvState.rate.isStale ? '⚠️ Dato antiguo — ' : '✓ '}
                        Actualizado {formatAge(bcvState.rate.ageMs)}
                        {bcvState.rate.valueDate &&
                            ` · Fecha valor: ${formatDate(bcvState.rate.valueDate)}`}
                    </p>
                )}
                {bcvState.error && !bcvState.rate && (
                    <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 6 }} />
                        {bcvState.error}
                    </p>
                )}
            </div>

            {/* ── Auto-Sync Selector ── */}
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${currentEvent?.rateSource !== 'CUSTOM' ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '16px 22px',
                    marginBottom: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s',
                }}
            >
                <div style={{ flex: 1, marginRight: 16 }}>
                    <p
                        style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            margin: '0 0 2px',
                        }}
                    >
                        Sincronización automática de tasa
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                        {currentEvent?.rateSource !== 'CUSTOM'
                            ? `La tasa se sincroniza automáticamente usando: ${
                                  currentEvent?.rateSource === 'USD_BCV'
                                      ? 'USD (BCV)'
                                      : currentEvent?.rateSource === 'EUR_BCV'
                                        ? 'EUR (BCV)'
                                        : 'USDt (Paralelo)'
                              }`
                            : 'La tasa se gestiona manualmente.'}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                        value={selectedRateSource}
                        onChange={(e) => {
                            setSelectedRateSource(
                                e.target.value as
                                    | 'USD_BCV'
                                    | 'EUR_BCV'
                                    | 'USDT_PARALELO'
                                    | 'CUSTOM',
                            );
                        }}
                        disabled={isTogglingAutoSync}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        <option value="CUSTOM">Manual (Custom)</option>
                        <option value="USD_BCV">USD (BCV Oficial)</option>
                        <option value="EUR_BCV">EUR (BCV Oficial)</option>
                        <option value="USDT_PARALELO">USDt (Dólar Paralelo)</option>
                    </select>
                    {selectedRateSource !== currentEvent?.rateSource && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                void handleSaveRateSource();
                            }}
                            disabled={isTogglingAutoSync}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            {isTogglingAutoSync ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} />
                                    Guardar
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tasa vigente del evento ── */}
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
                    Tasa vigente del evento
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
                                {currentEvent?.rateSource === 'EUR_BCV' ? 'Bs / €' : 'Bs / $'}
                            </span>
                        </p>
                        <p
                            style={{
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                                marginTop: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            Registrada el {formatDate(state.current.effectiveAt)}
                            {state.current.setByName ? (
                                <>
                                    {' '}
                                    por <strong>{state.current.setByName}</strong>
                                </>
                            ) : null}
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    marginLeft: 6,
                                    padding: '1px 8px',
                                    borderRadius: 10,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    background:
                                        state.current.source === 'manual'
                                            ? '#fef3c7'
                                            : state.current.source === 'paralelo'
                                              ? '#dcfce7'
                                              : '#dbeafe',
                                    color:
                                        state.current.source === 'manual'
                                            ? '#92400e'
                                            : state.current.source === 'paralelo'
                                              ? '#15803d'
                                              : '#1d4ed8',
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={
                                        state.current.source === 'manual'
                                            ? faUser
                                            : state.current.source === 'paralelo'
                                              ? faCoins
                                              : faGlobe
                                    }
                                    style={{ fontSize: 9 }}
                                />
                                {state.current.source === 'manual'
                                    ? 'Manual'
                                    : state.current.source === 'paralelo'
                                      ? 'Paralelo'
                                      : 'BCV'}
                            </span>
                        </p>
                    </>
                ) : (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                        {state.error ?? 'Sin tasa registrada para este evento.'}
                    </p>
                )}
            </div>

            {/* ── Registrar nueva tasa (manual) ── */}
            {!autoSyncEnabled && (
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
                        Registrar nueva tasa manualmente
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
            )}

            {/* ── Historial ── */}
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
                                        Origen
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
                                        <td style={{ padding: '10px 16px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '2px 8px',
                                                    borderRadius: 10,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    background:
                                                        er.source === 'manual'
                                                            ? '#fef3c7'
                                                            : er.source === 'paralelo'
                                                              ? '#dcfce7'
                                                              : '#dbeafe',
                                                    color:
                                                        er.source === 'manual'
                                                            ? '#92400e'
                                                            : er.source === 'paralelo'
                                                              ? '#15803d'
                                                              : '#1d4ed8',
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={
                                                        er.source === 'manual'
                                                            ? faUser
                                                            : er.source === 'paralelo'
                                                              ? faCoins
                                                              : faGlobe
                                                    }
                                                    style={{ fontSize: 9 }}
                                                />
                                                {er.source === 'manual'
                                                    ? 'Manual'
                                                    : er.source === 'paralelo'
                                                      ? 'Paralelo'
                                                      : 'BCV'}
                                            </span>
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
                                            {er.setByName || 'Sistema'}
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

/* ═══════════════════════════════════════════ BOT ASSISTANT TAB ═══════════════════════════════════════════ */
function BotAssistantTab({ eventId }: { eventId: string }) {
    const { currentEvent } = useEvent();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [config, setConfig] = useState<BotConfig | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(BotConfigToUpsertSchema),
        defaultValues: {
            telegramBotToken: '',
            salesWhatsappNumber: '',
            salesHandoffMessage: '',
            welcomeMessage: '',
            isEnabled: false,
        },
    });

    useEffect(() => {
        let mounted = true;
        botConfigService
            .get(eventId)
            .then((cfg) => {
                if (!mounted) return;
                setConfig(cfg);
                reset({
                    telegramBotToken: '',
                    salesWhatsappNumber: cfg.salesWhatsappNumber ?? '',
                    salesHandoffMessage: cfg.salesHandoffMessage ?? '',
                    welcomeMessage: cfg.welcomeMessage ?? '',
                    isEnabled: cfg.isEnabled,
                });
            })
            .catch((err) => {
                if (mounted) setLoadError(getApiErrorMessage(err));
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [eventId, reset]);

    const onSubmit = async (data: BotConfigToUpsertType) => {
        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            const updated = await botConfigService.upsert(eventId, data);
            setConfig(updated);
            reset({
                telegramBotToken: '',
                salesWhatsappNumber: updated.salesWhatsappNumber ?? '',
                salesHandoffMessage: updated.salesHandoffMessage ?? '',
                welcomeMessage: updated.welcomeMessage ?? '',
                isEnabled: updated.isEnabled,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setSaveError(getApiErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const onTestToken = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const raw = getValues('telegramBotToken');
            const token = typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
            const result = await botConfigService.test(eventId, token);
            setTestResult(
                result.ok
                    ? `✅ Token válido${result.botUsername ? ` — @${result.botUsername}` : ''}`
                    : '❌ El token no es válido.',
            );
        } catch (err) {
            setTestResult(`❌ ${getApiErrorMessage(err)}`);
        } finally {
            setIsTesting(false);
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
    const errorStyle: React.CSSProperties = { color: 'var(--danger)', fontSize: 12, marginTop: 4 };
    const hintStyle: React.CSSProperties = {
        fontSize: 12,
        color: 'var(--text-secondary)',
        marginTop: 4,
    };

    if (isLoading) {
        return (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                <FontAwesomeIcon icon={faSpinner} spin /> Cargando configuración...
            </div>
        );
    }

    if (loadError) {
        return (
            <div
                style={{
                    padding: '10px 14px',
                    background: 'var(--danger-light)',
                    border: '1px solid var(--danger)',
                    borderRadius: 8,
                    color: 'var(--danger)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {loadError}
            </div>
        );
    }

    const isActive = currentEvent?.status === 'ACTIVE';

    return (
        <form
            onSubmit={(e) => {
                void handleSubmit(onSubmit)(e);
            }}
            style={{ maxWidth: 700 }}
        >
            {!isActive && (
                <div
                    style={{
                        padding: '10px 14px',
                        background: 'var(--warning-light)',
                        border: '1px solid var(--warning)',
                        borderRadius: 8,
                        color: 'var(--warning)',
                        fontSize: 13,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    El bot solo atiende cuando el evento está en estado ACTIVO.
                </div>
            )}
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
                    Configuración del bot guardada correctamente.
                </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
                {/* Token de Telegram */}
                <div>
                    <label style={labelStyle}>Token de Telegram (BotFather)</label>
                    <input
                        {...register('telegramBotToken')}
                        type="password"
                        autoComplete="off"
                        placeholder={
                            config?.hasToken
                                ? `Token guardado (${config.tokenMask ?? '••••'}). Escribe uno nuevo para reemplazarlo.`
                                : 'Ej. 123456789:ABCdef...'
                        }
                        style={fieldStyle}
                    />
                    {errors.telegramBotToken && (
                        <p style={errorStyle}>{errors.telegramBotToken.message}</p>
                    )}
                    <p style={hintStyle}>
                        Crea un bot con @BotFather en Telegram y pega aquí el token. Se guarda{' '}
                        <strong>cifrado</strong> y solo se muestra enmascarado.
                    </p>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void onTestToken()}
                        disabled={isTesting}
                        style={{
                            marginTop: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        {isTesting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                            <FontAwesomeIcon icon={faPlug} />
                        )}
                        Probar token
                    </button>
                    {testResult && <p style={{ ...hintStyle, marginTop: 8 }}>{testResult}</p>}
                </div>

                {/* WhatsApp de ventas */}
                <div>
                    <label style={labelStyle}>Número de WhatsApp de ventas (opcional)</label>
                    <input
                        {...register('salesWhatsappNumber')}
                        placeholder="+584141234567"
                        style={fieldStyle}
                    />
                    {errors.salesWhatsappNumber && (
                        <p style={errorStyle}>{errors.salesWhatsappNumber.message}</p>
                    )}
                    <p style={hintStyle}>
                        Formato internacional. Si lo dejas vacío, el bot informará que la compra no
                        está disponible por este canal.
                    </p>
                </div>

                {/* Mensaje de bienvenida */}
                <div>
                    <label style={labelStyle}>Mensaje de bienvenida (opcional)</label>
                    <textarea
                        {...register('welcomeMessage')}
                        rows={3}
                        style={{ ...fieldStyle, resize: 'vertical' }}
                    />
                    {errors.welcomeMessage && (
                        <p style={errorStyle}>{errors.welcomeMessage.message}</p>
                    )}
                </div>

                {/* Mensaje de handoff */}
                <div>
                    <label style={labelStyle}>Mensaje de derivación a ventas (opcional)</label>
                    <textarea
                        {...register('salesHandoffMessage')}
                        rows={2}
                        style={{ ...fieldStyle, resize: 'vertical' }}
                    />
                    {errors.salesHandoffMessage && (
                        <p style={errorStyle}>{errors.salesHandoffMessage.message}</p>
                    )}
                </div>

                {/* Activar bot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                        {...register('isEnabled')}
                        type="checkbox"
                        id="bot-isEnabled"
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label
                        htmlFor="bot-isEnabled"
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        Activar bot
                    </label>
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

/* ═══════════════════════════════════════════ MAIN PAGE ═══════════════════════════════════════════ */
export function EventConfigPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [activeTab, setActiveTab] = useState<Tab>('general');

    if (!eventId) return null;

    const tabs: { id: Tab; label: string; icon: typeof faCog }[] = [
        { id: 'general', label: 'General', icon: faCog },
        { id: 'payment-methods', label: 'Métodos de pago', icon: faCreditCard },
        { id: 'exchange-rate', label: 'Tasa de cambio', icon: faExchangeAlt },
        { id: 'bot-assistant', label: 'Asistente / Bot', icon: faRobot },
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
                {activeTab === 'bot-assistant' && <BotAssistantTab eventId={eventId} />}
            </div>
        </div>
    );
}

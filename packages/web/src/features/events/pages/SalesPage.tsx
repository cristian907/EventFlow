import {
    SaleToCreateSchema,
    SaleToCreateType,
    TicketTypeType,
    PaymentMethodType,
    OrderSummaryType,
    OrderDetailType,
    TicketSummaryType,
    sumPaymentsInDivisa,
    BcvRateType,
} from '@eventflow/shared';
import {
    faPlus,
    faSpinner,
    faExclamationTriangle,
    faShoppingCart,
    faBoxOpen,
    faChevronLeft,
    faChevronRight,
    faTimes,
    faCheck,
    faTrash,
    faSearch,
    faDownload,
    faTicket,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { Resolver } from 'react-hook-form';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { bcvService } from '../services/bcvService';
import { exchangeRateService } from '../services/exchangeRateService';
import { paymentMethodService } from '../services/paymentMethodService';
import { salesService } from '../services/salesService';
import { ticketService } from '../services/ticketService';
import { ticketTypeService } from '../services/ticketTypeService';

/* ─── Helpers ─── */
const getApiError = (err: unknown): string =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    'Ocurrió un error inesperado.';

const fmtVES = (v: number) =>
    `Bs. ${v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

function isSellable(tt: TicketTypeType): boolean {
    if (!tt.isActive) return false;
    if (tt.availableQuantity <= 0) return false;
    const now = new Date();
    if (tt.saleStartsAt && now < new Date(tt.saleStartsAt)) return false;
    if (tt.saleEndsAt && now > new Date(tt.saleEndsAt)) return false;
    return true;
}

/* ─── List state ─── */
interface ListState {
    orders: OrderSummaryType[];
    total: number;
    page: number;
    isLoading: boolean;
    error: string | null;
}
type ListAction =
    | { type: 'LOADING' }
    | { type: 'SUCCESS'; orders: OrderSummaryType[]; total: number; page: number }
    | { type: 'ERROR'; message: string };

function listReducer(state: ListState, action: ListAction): ListState {
    switch (action.type) {
        case 'LOADING':
            return { ...state, isLoading: true, error: null };
        case 'SUCCESS':
            return {
                ...state,
                orders: action.orders,
                total: action.total,
                page: action.page,
                isLoading: false,
                error: null,
            };
        case 'ERROR':
            return { ...state, isLoading: false, error: action.message };
    }
}

const LIMIT = 15;

/* ─── Step types ─── */
type Step = 1 | 2 | 3;

/* ─── Order detail modal ─── */
function OrderDetailModal({ order, onClose }: { order: OrderDetailType; onClose: () => void }) {
    const { eventId } = useParams<{ eventId: string }>();
    const [tickets, setTickets] = useState<TicketSummaryType[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;
        ticketService
            .listByOrder(eventId, order.id)
            .then((res) => {
                if (!cancelled) setTickets(res.tickets);
            })
            .catch(() => {
                if (!cancelled) setTickets([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingTickets(false);
            });
        return () => {
            cancelled = true;
        };
    }, [eventId, order.id]);

    const handleDownload = async (ticketId: string) => {
        if (!eventId) return;
        setDownloadingId(ticketId);
        try {
            await ticketService.downloadTicket(eventId, ticketId);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadAll = async () => {
        if (!eventId) return;
        for (const t of tickets) {
            await ticketService.downloadTicket(eventId, t.id);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
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
                    padding: '2rem',
                    width: '100%',
                    maxWidth: 600,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-md)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                    }}
                >
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Detalle de Venta</h3>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <section>
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Cliente
                        </p>
                        <p style={{ margin: 0, fontWeight: 600 }}>{order.customer.fullName}</p>
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                            }}
                        >
                            CI: {order.customer.idNumber}
                            {order.customer.phone ? ` · ${order.customer.phone}` : ''}
                            {order.customer.email ? ` · ${order.customer.email}` : ''}
                        </p>
                    </section>

                    <section>
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Entradas
                        </p>
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem 0',
                                    borderBottom: '1px solid var(--border)',
                                }}
                            >
                                <span>
                                    {item.quantity}× {item.ticketTypeName}
                                </span>
                                <span style={{ fontWeight: 600 }}>
                                    {order.currency === 'EUR' ? '€' : '$'}{' '}
                                    {item.subtotal.toFixed(2)}
                                </span>
                            </div>
                        ))}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.75rem 0 0',
                                fontWeight: 700,
                            }}
                        >
                            <span>Total</span>
                            <span style={{ color: 'var(--primary)' }}>
                                {order.currency === 'EUR' ? '€' : '$'}{' '}
                                {order.totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </section>

                    <section>
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Pagos
                        </p>
                        {order.payments.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    padding: '0.5rem 0',
                                    borderBottom: '1px solid var(--border)',
                                    gap: '1rem',
                                }}
                            >
                                <div>
                                    <p style={{ margin: 0, fontWeight: 500 }}>
                                        {p.paymentMethodName}
                                    </p>
                                    {p.reference && (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            Ref: {p.reference}
                                        </p>
                                    )}
                                </div>
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    {p.amount.toFixed(2)} {p.currency}
                                </span>
                            </div>
                        ))}
                    </section>

                    <section>
                        <p
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.5rem',
                            }}
                        >
                            Tickets
                        </p>
                        {loadingTickets ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                <FontAwesomeIcon icon={faSpinner} spin /> Cargando tickets...
                            </p>
                        ) : tickets.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                No hay tickets generados para esta orden.
                            </p>
                        ) : (
                            <>
                                {tickets.map((t) => (
                                    <div
                                        key={t.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.4rem 0',
                                            borderBottom: '1px solid var(--border)',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.85rem' }}>
                                            <FontAwesomeIcon
                                                icon={faTicket}
                                                style={{
                                                    marginRight: '0.4rem',
                                                    color: 'var(--primary)',
                                                }}
                                            />
                                            {t.ticketTypeName}
                                            <span
                                                style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: 4,
                                                    background:
                                                        t.status === 'VALID'
                                                            ? 'var(--success-light)'
                                                            : t.status === 'USED'
                                                              ? 'var(--bg-surface)'
                                                              : 'var(--danger-light, #fee)',
                                                    color:
                                                        t.status === 'VALID'
                                                            ? 'var(--success)'
                                                            : t.status === 'USED'
                                                              ? 'var(--text-secondary)'
                                                              : 'var(--danger, red)',
                                                }}
                                            >
                                                {t.status}
                                            </span>
                                        </span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => void handleDownload(t.id)}
                                            disabled={downloadingId === t.id}
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            <FontAwesomeIcon
                                                icon={
                                                    downloadingId === t.id ? faSpinner : faDownload
                                                }
                                                spin={downloadingId === t.id}
                                            />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => void handleDownloadAll()}
                                    style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.8rem',
                                        width: '100%',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faDownload}
                                        style={{ marginRight: '0.4rem' }}
                                    />
                                    Descargar todos los tickets
                                </button>
                            </>
                        )}
                    </section>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <span>Vendedor: {order.soldByName}</span>
                        <span>Tasa: {order.exchangeRate} VES/USD</span>
                    </div>
                    <p
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            textAlign: 'right',
                        }}
                    >
                        {fmtDate(order.createdAt)}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── New Sale Wizard ─── */
function NewSaleModal({
    eventId,
    onClose,
    onSuccess,
}: {
    eventId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [step, setStep] = useState<Step>(1);
    const [ticketTypes, setTicketTypes] = useState<TicketTypeType[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([]);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [bcvRates, setBcvRates] = useState<BcvRateType | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successOrder, setSuccessOrder] = useState<OrderDetailType | null>(null);
    const [successTickets, setSuccessTickets] = useState<TicketSummaryType[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null);

    const form = useForm<SaleToCreateType>({
        resolver: zodResolver(SaleToCreateSchema) as Resolver<SaleToCreateType>,
        defaultValues: {
            ticketTypeId: '',
            quantity: 1,
            customer: { idNumber: '', fullName: '', phone: '', email: '' },
            payments: [{ paymentMethodId: '', amount: 0, currency: 'USD', reference: '' }],
        },
    });
    const {
        fields: paymentFields,
        append,
        remove,
    } = useFieldArray({
        control: form.control,
        name: 'payments',
    });

    const watchTicketTypeId = useWatch({ control: form.control, name: 'ticketTypeId' });
    const watchQuantity = useWatch({ control: form.control, name: 'quantity' });
    const watchPayments = useWatch({ control: form.control, name: 'payments' });

    useEffect(() => {
        async function loadFormData() {
            try {
                setLoadingData(true);
                const [ttResponse, pmList, rateResponse, bcvRateResponse] = await Promise.all([
                    ticketTypeService.list(eventId, false),
                    paymentMethodService.list(eventId),
                    exchangeRateService.getCurrent(eventId),
                    bcvService.getRate().catch(() => null),
                ]);
                const sellable = ttResponse.ticketTypes.filter(isSellable);
                setTicketTypes(sellable);
                setPaymentMethods(pmList.filter((pm) => pm.isActive));
                setExchangeRate(rateResponse.current?.rate ?? null);
                setBcvRates(bcvRateResponse);
            } catch (err) {
                setLoadError(getApiError(err));
            } finally {
                setLoadingData(false);
            }
        }
        void loadFormData();
    }, [eventId]);

    useEffect(() => {
        if (!successOrder) return;
        let cancelled = false;
        ticketService
            .listByOrder(eventId, successOrder.id)
            .then((res) => {
                if (!cancelled) setSuccessTickets(res.tickets);
            })
            .catch(() => {
                if (!cancelled) setSuccessTickets([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingTickets(false);
            });
        return () => {
            cancelled = true;
        };
    }, [eventId, successOrder]);

    const { currentEvent } = useEvent();

    const baseCurrency = currentEvent?.rateSource === 'EUR_BCV' ? 'EUR' : 'USD';
    const baseSymbol = baseCurrency === 'EUR' ? '€' : '$';

    const usdToVesRate = (() => {
        if (currentEvent?.rateSource === 'CUSTOM') return exchangeRate || 0;
        if (currentEvent?.rateSource === 'USDT_PARALELO')
            return bcvRates?.usdtRate || exchangeRate || 0;
        return bcvRates?.usdRate || exchangeRate || 0;
    })();

    const eurToVesRate = bcvRates?.eurRate || usdToVesRate * 1.08;

    const selectedTicketType = ticketTypes.find((tt) => tt.id === watchTicketTypeId);

    const subtotalUSD = selectedTicketType ? selectedTicketType.usdPrice * (watchQuantity || 0) : 0;

    const enrichedWatchPayments = watchPayments.map((p) => {
        const pm = paymentMethods.find((item) => item.id === p.paymentMethodId);
        return {
            amount: Number(p.amount) || 0,
            currency: (pm ? pm.currency : 'USD') as 'USD' | 'VES' | 'EUR',
        };
    });

    const paidUSD =
        exchangeRate !== null
            ? sumPaymentsInDivisa(
                  enrichedWatchPayments,
                  baseCurrency,
                  exchangeRate,
                  eurToVesRate,
                  usdToVesRate,
              )
            : 0;

    const subtotalVES = selectedTicketType
        ? selectedTicketType.currency === 'VES'
            ? selectedTicketType.price * (watchQuantity || 0)
            : subtotalUSD * (exchangeRate ?? 0)
        : 0;

    const paidVES = enrichedWatchPayments.reduce((acc, p) => {
        if (p.currency === 'VES') return acc + p.amount;
        if (p.currency === 'USD') return acc + p.amount * usdToVesRate;
        if (p.currency === 'EUR') return acc + p.amount * eurToVesRate;
        return acc;
    }, 0);

    const remainingVES = subtotalVES - paidVES;
    const remainingUSD = subtotalUSD - paidUSD;
    const canComplete = paidUSD >= subtotalUSD && subtotalUSD > 0;

    const changeUSD = Math.max(0, paidUSD - subtotalUSD);
    const changeVES = changeUSD * (exchangeRate ?? 0);

    async function handleSearchCustomer() {
        const idNumber = form.getValues('customer.idNumber');
        if (!idNumber) return;
        try {
            const result = await salesService.listOrders(eventId, { idNumber, limit: 1 });
            if (result.orders.length > 0) {
                const c = result.orders[0].customer;
                form.setValue('customer.fullName', c.fullName);
                form.setValue('customer.phone', c.phone ?? '');
                form.setValue('customer.email', c.email ?? '');
            }
        } catch {
            // no match found, continue
        }
    }

    async function handleSubmit(data: SaleToCreateType): Promise<void> {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const enrichedPayments = data.payments.map((p) => {
                const pm = paymentMethods.find((item) => item.id === p.paymentMethodId);
                return {
                    ...p,
                    currency: pm ? pm.currency : 'USD',
                };
            });
            const payload = {
                ...data,
                payments: enrichedPayments,
            };
            const order = await salesService.createSale(eventId, payload);
            setSuccessOrder(order);
        } catch (err) {
            setSubmitError(getApiError(err));
        } finally {
            setSubmitting(false);
        }
    }

    if (successOrder) {
        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}
            >
                <div
                    style={{
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--r-lg)',
                        padding: '2.5rem',
                        width: '100%',
                        maxWidth: 480,
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'var(--success-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            style={{ color: 'var(--success)', fontSize: '1.5rem' }}
                        />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                        ¡Venta registrada!
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {successOrder.items[0]?.quantity}× {successOrder.items[0]?.ticketTypeName} —{' '}
                        {successOrder.currency === 'EUR' ? '€' : '$'}{' '}
                        {successOrder.totalAmount.toFixed(2)}
                    </p>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.75rem',
                            background: 'var(--bg-surface)',
                            borderRadius: 8,
                            marginBottom: '1.5rem',
                            textAlign: 'left',
                        }}
                    >
                        {loadingTickets ? (
                            <p
                                style={{
                                    color: 'var(--text-secondary)',
                                    margin: 0,
                                    textAlign: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={faSpinner} spin /> Cargando tickets...
                            </p>
                        ) : successTickets.length === 0 ? (
                            <p
                                style={{
                                    color: 'var(--text-secondary)',
                                    margin: 0,
                                    textAlign: 'center',
                                }}
                            >
                                No se encontraron tickets.
                            </p>
                        ) : (
                            <>
                                <p
                                    style={{
                                        fontWeight: 600,
                                        margin: '0 0 0.5rem',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faTicket}
                                        style={{ marginRight: '0.4rem' }}
                                    />
                                    {successTickets.length} ticket
                                    {successTickets.length > 1 ? 's' : ''} generado
                                    {successTickets.length > 1 ? 's' : ''}
                                </p>
                                {successTickets.map((t) => (
                                    <div
                                        key={t.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.3rem 0',
                                            borderBottom: '1px solid var(--border)',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8rem' }}>
                                            {t.ticketTypeName} — {t.qrCode.slice(0, 8)}
                                        </span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                            }}
                                            disabled={downloadingTicketId === t.id}
                                            onClick={() => {
                                                setDownloadingTicketId(t.id);
                                                void ticketService
                                                    .downloadTicket(eventId, t.id)
                                                    .finally(() => setDownloadingTicketId(null));
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={
                                                    downloadingTicketId === t.id
                                                        ? faSpinner
                                                        : faDownload
                                                }
                                                spin={downloadingTicketId === t.id}
                                            />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.8rem',
                                        width: '100%',
                                    }}
                                    onClick={() => {
                                        void (async () => {
                                            for (const t of successTickets) {
                                                await ticketService.downloadTicket(eventId, t.id);
                                            }
                                        })();
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faDownload}
                                        style={{ marginRight: '0.4rem' }}
                                    />
                                    Descargar todos
                                </button>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                        >
                            Cerrar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                form.reset();
                                setStep(1);
                                setSuccessOrder(null);
                                setSubmitError(null);
                            }}
                        >
                            Nueva venta
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-lg)',
                    width: '100%',
                    maxWidth: step === 1 ? 800 : 560,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '1.5rem 2rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Nueva Venta</h3>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Paso {step} de 3 —{' '}
                            {step === 1 ? 'Entradas' : step === 2 ? 'Cliente' : 'Pagos'}
                        </p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Step indicators */}
                <div
                    style={{
                        display: 'flex',
                        gap: 0,
                        padding: '0 2rem',
                        paddingTop: '1rem',
                    }}
                >
                    {([1, 2, 3] as Step[]).map((s) => (
                        <div
                            key={s}
                            style={{
                                flex: 1,
                                height: 3,
                                background: s <= step ? 'var(--primary)' : 'var(--border)',
                                borderRadius: 2,
                                marginRight: s < 3 ? 4 : 0,
                            }}
                        />
                    ))}
                </div>

                {loadingData ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            style={{ color: 'var(--primary)', fontSize: '1.5rem' }}
                        />
                    </div>
                ) : loadError ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <p>{loadError}</p>
                    </div>
                ) : exchangeRate === null ? (
                    <div
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            background: 'var(--warning-light)',
                            margin: '1rem 2rem',
                            borderRadius: 8,
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}
                        />
                        <p style={{ margin: 0, color: 'var(--warning)' }}>
                            Este evento no tiene una tasa de cambio vigente. Configúrela antes de
                            registrar ventas.
                        </p>
                    </div>
                ) : (
                    <form
                        onSubmit={(e) =>
                            void form.handleSubmit(
                                handleSubmit as Parameters<typeof form.handleSubmit>[0],
                            )(e)
                        }
                        style={{
                            padding: '1.5rem 2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                        }}
                    >
                        {/* ─── STEP 1: Entradas ─── */}
                        {step === 1 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1.5rem',
                                }}
                            >
                                {/* Left: form */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: 'block',
                                                marginBottom: '0.4rem',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            Tipo de entrada
                                        </label>
                                        <select
                                            {...form.register('ticketTypeId')}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: 8,
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-surface)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {ticketTypes.map((tt) => (
                                                <option key={tt.id} value={tt.id}>
                                                    {tt.name} — {baseSymbol}
                                                    {tt.usdPrice.toFixed(2)}
                                                    {tt.currency === 'VES' &&
                                                        ` (~ Bs. ${tt.price.toFixed(2)})`}{' '}
                                                    ({tt.availableQuantity} disp.)
                                                </option>
                                            ))}
                                        </select>
                                        {ticketTypes.length === 0 && (
                                            <p
                                                style={{
                                                    margin: '0.25rem 0 0',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--warning)',
                                                }}
                                            >
                                                No hay tipos de entrada disponibles para venta.
                                            </p>
                                        )}
                                        {form.formState.errors.ticketTypeId && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: '0.8rem',
                                                    margin: '0.25rem 0 0',
                                                }}
                                            >
                                                {form.formState.errors.ticketTypeId.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            style={{
                                                display: 'block',
                                                marginBottom: '0.4rem',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={selectedTicketType?.availableQuantity ?? 1}
                                            {...form.register('quantity')}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: 8,
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-surface)',
                                                fontSize: '0.9rem',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        {form.formState.errors.quantity && (
                                            <p
                                                style={{
                                                    color: 'var(--danger)',
                                                    fontSize: '0.8rem',
                                                    margin: '0.25rem 0 0',
                                                }}
                                            >
                                                {form.formState.errors.quantity.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: summary */}
                                <div
                                    style={{
                                        background: 'var(--bg-surface)',
                                        borderRadius: 10,
                                        padding: '1.25rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: 0,
                                            fontWeight: 700,
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        Resumen
                                    </p>
                                    {selectedTicketType ? (
                                        <>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    Precio unitario ({baseCurrency})
                                                </span>
                                                <span>
                                                    {baseSymbol}{' '}
                                                    {selectedTicketType.usdPrice.toFixed(2)}
                                                </span>
                                            </div>
                                            {selectedTicketType.currency === 'VES' && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    <span
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        ≈ en VES
                                                    </span>
                                                    <span>{fmtVES(selectedTicketType.price)}</span>
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                <span style={{ color: 'var(--text-secondary)' }}>
                                                    Cantidad
                                                </span>
                                                <span>{watchQuantity || 0}</span>
                                            </div>
                                            <div
                                                style={{
                                                    borderTop: '1px solid var(--border)',
                                                    paddingTop: '0.75rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <span>Subtotal ({baseCurrency})</span>
                                                <span style={{ color: 'var(--primary)' }}>
                                                    {baseSymbol} {subtotalUSD.toFixed(2)}
                                                </span>
                                            </div>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                Tasa: {exchangeRate} VES/{baseCurrency}
                                            </p>
                                        </>
                                    ) : (
                                        <p
                                            style={{
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.875rem',
                                                margin: 0,
                                            }}
                                        >
                                            Selecciona un tipo de entrada para ver el resumen.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── STEP 2: Cliente ─── */}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            marginBottom: '0.4rem',
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        Cédula de Identidad
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            {...form.register('customer.idNumber')}
                                            placeholder="Ej: V-12345678"
                                            style={{
                                                flex: 1,
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: 8,
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-surface)',
                                                fontSize: '0.9rem',
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => void handleSearchCustomer()}
                                            title="Buscar cliente"
                                        >
                                            <FontAwesomeIcon icon={faSearch} />
                                        </button>
                                    </div>
                                    {form.formState.errors.customer?.idNumber && (
                                        <p
                                            style={{
                                                color: 'var(--danger)',
                                                fontSize: '0.8rem',
                                                margin: '0.25rem 0 0',
                                            }}
                                        >
                                            {form.formState.errors.customer.idNumber.message}
                                        </p>
                                    )}
                                </div>

                                {[
                                    {
                                        field: 'customer.fullName' as const,
                                        label: 'Nombre completo',
                                        required: true,
                                        type: 'text',
                                        placeholder: '',
                                    },
                                    {
                                        field: 'customer.phone' as const,
                                        label: 'Teléfono',
                                        required: false,
                                        type: 'tel',
                                        placeholder: 'Opcional',
                                    },
                                    {
                                        field: 'customer.email' as const,
                                        label: 'Email',
                                        required: false,
                                        type: 'email',
                                        placeholder: 'Opcional',
                                    },
                                ].map(({ field, label, required, type, placeholder }) => (
                                    <div key={field}>
                                        <label
                                            style={{
                                                display: 'block',
                                                marginBottom: '0.4rem',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {label}
                                            {!required && (
                                                <span
                                                    style={{
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: 400,
                                                        marginLeft: '0.35rem',
                                                    }}
                                                >
                                                    (opcional)
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            {...form.register(field)}
                                            type={type}
                                            placeholder={placeholder}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: 8,
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-surface)',
                                                fontSize: '0.9rem',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        {field === 'customer.fullName' &&
                                            form.formState.errors.customer?.fullName && (
                                                <p
                                                    style={{
                                                        color: 'var(--danger)',
                                                        fontSize: '0.8rem',
                                                        margin: '0.25rem 0 0',
                                                    }}
                                                >
                                                    {
                                                        form.formState.errors.customer.fullName
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        {field === 'customer.phone' &&
                                            form.formState.errors.customer?.phone && (
                                                <p
                                                    style={{
                                                        color: 'var(--danger)',
                                                        fontSize: '0.8rem',
                                                        margin: '0.25rem 0 0',
                                                    }}
                                                >
                                                    {form.formState.errors.customer.phone.message}
                                                </p>
                                            )}
                                        {field === 'customer.email' &&
                                            form.formState.errors.customer?.email && (
                                                <p
                                                    style={{
                                                        color: 'var(--danger)',
                                                        fontSize: '0.8rem',
                                                        margin: '0.25rem 0 0',
                                                    }}
                                                >
                                                    {form.formState.errors.customer.email.message}
                                                </p>
                                            )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ─── STEP 3: Pagos ─── */}
                        {step === 3 && (
                            <div
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                            >
                                {/* Payment summary bar */}
                                <div
                                    style={{
                                        background: 'var(--bg-surface)',
                                        borderRadius: 10,
                                        padding: '1rem 1.25rem',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: '0.5rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    {[
                                        {
                                            label: 'Total',
                                            usd: `${baseSymbol} ${subtotalUSD.toFixed(2)}`,
                                            ves: fmtVES(subtotalVES),
                                            color: 'var(--text-primary)',
                                        },
                                        {
                                            label: 'Pagado',
                                            usd: `${baseSymbol} ${paidUSD.toFixed(2)}`,
                                            ves: fmtVES(paidVES),
                                            color:
                                                paidUSD >= subtotalUSD
                                                    ? 'var(--success)'
                                                    : 'var(--warning)',
                                        },
                                        {
                                            label: 'Restante',
                                            usd: `${baseSymbol} ${Math.max(0, remainingUSD).toFixed(2)}`,
                                            ves: fmtVES(Math.max(0, remainingVES)),
                                            color:
                                                remainingUSD <= 0
                                                    ? 'var(--success)'
                                                    : 'var(--danger)',
                                        },
                                    ].map(({ label, usd, ves, color }) => (
                                        <div key={label}>
                                            <p
                                                style={{
                                                    margin: '0 0 0.25rem',
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {label}
                                            </p>
                                            <p
                                                style={{
                                                    margin: '0 0 0.1rem',
                                                    fontWeight: 700,
                                                    color,
                                                    fontSize: '0.95rem',
                                                }}
                                            >
                                                {usd}
                                            </p>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 500,
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {ves}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {changeUSD > 0 && (
                                    <div
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            border: '1px solid var(--success)',
                                            borderRadius: 10,
                                            padding: '0.8rem 1.25rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--success)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            Vuelto a entregar:
                                        </span>
                                        <div style={{ textAlign: 'right' }}>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 700,
                                                    color: 'var(--success)',
                                                    fontSize: '1rem',
                                                }}
                                            >
                                                {baseSymbol} {changeUSD.toFixed(2)}
                                            </p>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 500,
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {fmtVES(changeVES)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Payment entries */}
                                {paymentFields.map((field, index) => {
                                    const selectedPmId = watchPayments[index]?.paymentMethodId;
                                    const selectedPm = paymentMethods.find(
                                        (pm) => pm.id === selectedPmId,
                                    );
                                    const pmCurrency = selectedPm ? selectedPm.currency : '';

                                    return (
                                        <div
                                            key={field.id}
                                            style={{
                                                border: '1px solid var(--border)',
                                                borderRadius: 10,
                                                padding: '1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.75rem',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    Pago {index + 1}
                                                </span>
                                                {paymentFields.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => remove(index)}
                                                        style={{ color: 'var(--danger)' }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                )}
                                            </div>

                                            <div style={{ marginBottom: '0.2rem' }}>
                                                <label
                                                    style={{
                                                        display: 'block',
                                                        marginBottom: '0.3rem',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Método de pago
                                                </label>
                                                <select
                                                    {...form.register(
                                                        `payments.${index}.paymentMethodId`,
                                                    )}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem 0.65rem',
                                                        borderRadius: 8,
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--bg-surface)',
                                                        fontSize: '0.875rem',
                                                        boxSizing: 'border-box',
                                                    }}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {paymentMethods.map((pm) => (
                                                        <option key={pm.id} value={pm.id}>
                                                            {pm.name} (
                                                            {pm.currency === 'VES'
                                                                ? 'Bs.'
                                                                : pm.currency === 'EUR'
                                                                  ? 'EUR'
                                                                  : 'USD'}
                                                            )
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '0.75rem',
                                                }}
                                            >
                                                <div>
                                                    <label
                                                        style={{
                                                            display: 'block',
                                                            marginBottom: '0.3rem',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Monto{' '}
                                                        {pmCurrency
                                                            ? `(${pmCurrency === 'VES' ? 'Bs.' : pmCurrency})`
                                                            : ''}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        {...form.register(
                                                            `payments.${index}.amount`,
                                                        )}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem 0.65rem',
                                                            borderRadius: 8,
                                                            border: '1px solid var(--border)',
                                                            background: 'var(--bg-surface)',
                                                            fontSize: '0.875rem',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        style={{
                                                            display: 'block',
                                                            marginBottom: '0.3rem',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Referencia{' '}
                                                        <span
                                                            style={{
                                                                color: 'var(--text-secondary)',
                                                                fontWeight: 400,
                                                            }}
                                                        >
                                                            (opcional)
                                                        </span>
                                                    </label>
                                                    <input
                                                        {...form.register(
                                                            `payments.${index}.reference`,
                                                        )}
                                                        placeholder=""
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.5rem 0.65rem',
                                                            borderRadius: 8,
                                                            border: '1px solid var(--border)',
                                                            background: 'var(--bg-surface)',
                                                            fontSize: '0.875rem',
                                                            boxSizing: 'border-box',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() =>
                                        append({
                                            paymentMethodId: '',
                                            amount: 0,
                                            currency: 'USD',
                                            reference: '',
                                        })
                                    }
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        style={{ marginRight: '0.4rem' }}
                                    />
                                    Agregar pago
                                </button>

                                {submitError && (
                                    <div
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'var(--danger-light)',
                                            borderRadius: 8,
                                            color: 'var(--danger)',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faExclamationTriangle}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        {submitError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation buttons */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: '0.5rem',
                                borderTop: '1px solid var(--border)',
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={
                                    step === 1 ? onClose : () => setStep((s) => (s - 1) as Step)
                                }
                            >
                                <FontAwesomeIcon
                                    icon={step === 1 ? faTimes : faChevronLeft}
                                    style={{ marginRight: '0.4rem' }}
                                />
                                {step === 1 ? 'Cancelar' : 'Anterior'}
                            </button>

                            {step < 3 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() =>
                                        void (async () => {
                                            if (step === 1) {
                                                const valid = await form.trigger([
                                                    'ticketTypeId',
                                                    'quantity',
                                                ]);
                                                if (!valid) return;
                                            }
                                            if (step === 2) {
                                                const valid = await form.trigger([
                                                    'customer.idNumber',
                                                    'customer.fullName',
                                                    'customer.phone',
                                                    'customer.email',
                                                ]);
                                                if (!valid) return;
                                            }
                                            setStep((s) => (s + 1) as Step);
                                        })()
                                    }
                                >
                                    Siguiente
                                    <FontAwesomeIcon
                                        icon={faChevronRight}
                                        style={{ marginLeft: '0.4rem' }}
                                    />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!canComplete || submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                spin
                                                style={{ marginRight: '0.4rem' }}
                                            />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                style={{ marginRight: '0.4rem' }}
                                            />
                                            Completar venta
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

/* ─── Main page ─── */
export default function SalesPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { currentEvent } = useEvent();

    const [state, dispatch] = useReducer(listReducer, {
        orders: [],
        total: 0,
        page: 1,
        isLoading: true,
        error: null,
    });

    const [idNumberFilter, setIdNumberFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetailType | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const loadOrders = useCallback(
        async (page = 1) => {
            if (!eventId) return;
            dispatch({ type: 'LOADING' });
            try {
                const result = await salesService.listOrders(eventId, {
                    page,
                    limit: LIMIT,
                    idNumber: idNumberFilter || undefined,
                    startDate: startDateFilter || undefined,
                    endDate: endDateFilter || undefined,
                });
                dispatch({ type: 'SUCCESS', orders: result.orders, total: result.total, page });
            } catch (err) {
                dispatch({ type: 'ERROR', message: getApiError(err) });
            }
        },
        [eventId, idNumberFilter, startDateFilter, endDateFilter],
    );

    useEffect(() => {
        void loadOrders(1);
    }, [loadOrders]);

    async function handleRowClick(orderId: string) {
        if (!eventId) return;
        setLoadingDetail(true);
        try {
            const order = await salesService.getOrderDetail(eventId, orderId);
            setSelectedOrder(order);
        } catch {
            // silently ignore
        } finally {
            setLoadingDetail(false);
        }
    }

    const totalPages = Math.ceil(state.total / LIMIT);

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faShoppingCart}
                            style={{ color: 'var(--primary)' }}
                        />
                        Registro de Ventas
                    </h2>
                    {currentEvent && (
                        <p
                            style={{
                                margin: '0.25rem 0 0',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                            }}
                        >
                            {currentEvent.name}
                        </p>
                    )}
                </div>
                <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '0.5rem' }} />
                    Nueva venta
                </button>
            </div>

            {/* Filters */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                }}
            >
                <input
                    type="text"
                    placeholder="Buscar por cédula..."
                    value={idNumberFilter}
                    onChange={(e) => setIdNumberFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        fontSize: '0.875rem',
                        minWidth: 180,
                    }}
                />
                <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        fontSize: '0.875rem',
                    }}
                />
                <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        fontSize: '0.875rem',
                    }}
                />
                {(idNumberFilter || startDateFilter || endDateFilter) && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                            setIdNumberFilter('');
                            setStartDateFilter('');
                            setEndDateFilter('');
                        }}
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {/* Table */}
            <div
                style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                {state.isLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            style={{ color: 'var(--primary)', fontSize: '1.5rem' }}
                        />
                    </div>
                ) : state.error ? (
                    <div
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--danger)',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            style={{ marginBottom: '0.5rem' }}
                        />
                        <p>{state.error}</p>
                    </div>
                ) : state.orders.length === 0 ? (
                    <div
                        style={{
                            padding: '3rem',
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faBoxOpen}
                            style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}
                        />
                        <p style={{ margin: 0 }}>No hay ventas registradas.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-surface)' }}>
                                    {[
                                        'Fecha',
                                        'Cliente',
                                        'Entradas',
                                        'Total',
                                        'Métodos de pago',
                                        'Vendedor',
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'left',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: 'var(--text-secondary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {state.orders.map((order, i) => (
                                    <tr
                                        key={order.id}
                                        onClick={() => void handleRowClick(order.id)}
                                        style={{
                                            cursor: 'pointer',
                                            background:
                                                i % 2 === 0
                                                    ? 'var(--bg-elevated)'
                                                    : 'var(--bg-surface)',
                                            borderTop: '1px solid var(--border)',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            (
                                                e.currentTarget as HTMLTableRowElement
                                            ).style.background = 'var(--primary-light)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (
                                                e.currentTarget as HTMLTableRowElement
                                            ).style.background =
                                                i % 2 === 0
                                                    ? 'var(--bg-elevated)'
                                                    : 'var(--bg-surface)';
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.85rem',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {fmtDate(order.createdAt)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {order.customer.fullName}
                                            </p>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '0.775rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                CI: {order.customer.idNumber}
                                            </p>
                                        </td>
                                        <td
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {order.item.quantity}× {order.item.ticketTypeName}
                                        </td>
                                        <td
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {order.currency === 'EUR' ? '€' : '$'}{' '}
                                            {order.totalAmount.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {order.paymentMethods.join(', ')}
                                        </td>
                                        <td
                                            style={{
                                                padding: '0.75rem 1rem',
                                                fontSize: '0.85rem',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {order.soldByName}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem',
                        marginTop: '1rem',
                    }}
                >
                    <button
                        className="btn btn-ghost btn-sm"
                        disabled={state.page <= 1}
                        onClick={() => void loadOrders(state.page - 1)}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Página {state.page} de {totalPages} ({state.total} ventas)
                    </span>
                    <button
                        className="btn btn-ghost btn-sm"
                        disabled={state.page >= totalPages}
                        onClick={() => void loadOrders(state.page + 1)}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            )}

            {/* Loading detail overlay */}
            {loadingDetail && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999,
                    }}
                >
                    <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        style={{ fontSize: '2rem', color: 'var(--primary)' }}
                    />
                </div>
            )}

            {/* Modals */}
            {showWizard && eventId && (
                <NewSaleModal
                    eventId={eventId}
                    onClose={() => setShowWizard(false)}
                    onSuccess={() => void loadOrders(1)}
                />
            )}

            {selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}
        </div>
    );
}

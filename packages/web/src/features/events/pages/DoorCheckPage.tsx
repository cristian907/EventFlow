import type { AccessResultType, AccessSearchTicket, AccessTicketInfo } from '@eventflow/shared';
import {
    faCamera,
    faKeyboard,
    faSearch,
    faSpinner,
    faVideoSlash,
    faCheck,
    faExclamationTriangle,
    faBan,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Html5Qrcode } from 'html5-qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { accessService } from '../services/accessService';
import '../styles/DoorCheckPage.css';

const getApiError = (err: unknown): string =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    'Ocurrió un error inesperado.';

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

/* ─── Audio feedback ─── */
function playBeep(success: boolean) {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = success ? 880 : 300;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + (success ? 0.15 : 0.3));
    } catch {
        // AudioContext not available
    }
}

/* ─── Result Overlay (scanner mode) ─── */
interface OverlayData {
    result: AccessResultType;
    ticket?: AccessTicketInfo;
    message: string;
}

const OVERLAY_ICONS: Record<AccessResultType, typeof faCheck> = {
    valid: faCheck,
    already_used: faExclamationTriangle,
    cancelled: faBan,
    invalid: faTimes,
};

const OVERLAY_TITLES: Record<AccessResultType, string> = {
    valid: 'Entrada válida',
    already_used: 'Ya fue validada',
    cancelled: 'Ticket cancelado',
    invalid: 'Entrada no válida',
};

function ResultOverlay({ data }: { data: OverlayData }) {
    return (
        <div className={`door-check__overlay door-check__overlay--${data.result}`}>
            <div className="door-check__overlay-icon">
                <FontAwesomeIcon icon={OVERLAY_ICONS[data.result]} />
            </div>
            <div className="door-check__overlay-title">{OVERLAY_TITLES[data.result]}</div>
            {data.ticket && (
                <>
                    <div className="door-check__overlay-name">{data.ticket.customerName}</div>
                    <div className="door-check__overlay-detail">
                        {data.ticket.ticketTypeName}
                        {data.result === 'already_used' && data.ticket.usedAt && (
                            <> &middot; Usado a las {fmtTime(data.ticket.usedAt)}</>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── QR Scanner View ─── */
function QrScannerView({
    eventId,
    onResult,
}: {
    eventId: string;
    onResult: (data: OverlayData) => void;
}) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const processingRef = useRef(false);
    const mountedRef = useRef(true);

    const handleScan = useCallback(
        async (decodedText: string) => {
            if (processingRef.current) return;
            processingRef.current = true;
            try {
                const result = await accessService.scan(eventId, decodedText);
                if (!mountedRef.current) return;
                playBeep(result.result === 'valid');
                onResult(result);
            } catch (err) {
                if (!mountedRef.current) return;
                playBeep(false);
                onResult({ result: 'invalid', message: getApiError(err) });
            } finally {
                setTimeout(() => {
                    processingRef.current = false;
                }, 3500);
            }
        },
        [eventId, onResult],
    );

    useEffect(() => {
        mountedRef.current = true;
        let html5Qr: Html5Qrcode | null = null;

        const startScanner = async () => {
            if (!containerRef.current) return;
            try {
                html5Qr = new Html5Qrcode('door-check-scanner-region');
                scannerRef.current = html5Qr;
                await html5Qr.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (text) => void handleScan(text),
                    () => {},
                );
            } catch {
                if (mountedRef.current) {
                    setCameraError(
                        'No se pudo acceder a la cámara. Verifica los permisos o usa el modo manual.',
                    );
                }
            }
        };

        void startScanner();

        return () => {
            mountedRef.current = false;
            if (html5Qr?.isScanning) {
                html5Qr.stop().catch(() => {});
            }
        };
    }, [handleScan]);

    if (cameraError) {
        return (
            <div className="door-check__scanner">
                <div className="door-check__camera-error">
                    <FontAwesomeIcon icon={faVideoSlash} />
                    <p>{cameraError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="door-check__scanner">
            <div
                id="door-check-scanner-region"
                ref={containerRef}
                style={{ width: '100%', height: '100%' }}
            />
            <div className="door-check__scanner-hint">
                Coloca el QR dentro del cuadro
                <small>La lectura es continua, no necesitas presionar nada</small>
            </div>
        </div>
    );
}

/* ─── Manual Search View ─── */
function ManualSearchView({ eventId }: { eventId: string }) {
    const [idNumber, setIdNumber] = useState('');
    const [tickets, setTickets] = useState<AccessSearchTicket[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [searched, setSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<OverlayData | null>(null);
    const [markingId, setMarkingId] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = idNumber.trim();
        if (!trimmed) return;
        setIsLoading(true);
        setSearched(false);
        setToast(null);
        try {
            const res = await accessService.search(eventId, trimmed);
            setTickets(res.tickets);
            setCustomerName(res.customer?.fullName ?? '');
            setCustomerId(res.customer?.idNumber ?? '');
            setSearched(true);
        } catch (err) {
            setToast({ result: 'invalid', message: getApiError(err) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkUsed = async (ticketId: string) => {
        setMarkingId(ticketId);
        setToast(null);
        try {
            const res = await accessService.manualUse(eventId, ticketId);
            playBeep(res.result === 'valid');
            setToast(res);
            if (res.result === 'valid' || res.result === 'already_used') {
                setTickets((prev) =>
                    prev.map((t) =>
                        t.id === ticketId
                            ? { ...t, status: 'USED' as const, usedAt: new Date().toISOString() }
                            : t,
                    ),
                );
            }
        } catch (err) {
            playBeep(false);
            setToast({ result: 'invalid', message: getApiError(err) });
        } finally {
            setMarkingId(null);
        }
    };

    return (
        <div className="door-check__manual">
            <form className="door-check__search-form" onSubmit={(e) => void handleSearch(e)}>
                <input
                    className="door-check__search-input"
                    type="text"
                    placeholder="Cédula del cliente (ej: V12345678)"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    autoFocus
                />
                <button className="btn btn-primary" type="submit" disabled={isLoading}>
                    <FontAwesomeIcon icon={isLoading ? faSpinner : faSearch} spin={isLoading} />
                    &nbsp;Buscar
                </button>
            </form>

            {toast && (
                <div className={`door-check__toast door-check__toast--${toast.result}`}>
                    <FontAwesomeIcon icon={OVERLAY_ICONS[toast.result]} /> {toast.message}
                    {toast.ticket?.usedAt && toast.result === 'already_used' && (
                        <> &middot; Usado a las {fmtTime(toast.ticket.usedAt)}</>
                    )}
                </div>
            )}

            {searched && customerName && (
                <div className="door-check__customer-info">
                    <div className="door-check__customer-name">{customerName}</div>
                    <div className="door-check__customer-id">Cédula: {customerId}</div>
                </div>
            )}

            {searched && tickets.length === 0 && (
                <div className="door-check__empty">
                    No se encontraron tickets para esta cédula en este evento.
                </div>
            )}

            {tickets.length > 0 && (
                <div className="door-check__ticket-list">
                    {tickets.map((t) => (
                        <div key={t.id} className="door-check__ticket-card">
                            <div className="door-check__ticket-info">
                                <div className="door-check__ticket-type">{t.ticketTypeName}</div>
                                <div className="door-check__ticket-meta">
                                    {t.customerName}
                                    {t.usedAt && <> &middot; Usado {fmtTime(t.usedAt)}</>}
                                </div>
                            </div>
                            <span
                                className={`door-check__ticket-status door-check__ticket-status--${t.status}`}
                            >
                                {t.status === 'VALID'
                                    ? 'Válido'
                                    : t.status === 'USED'
                                      ? 'Usado'
                                      : 'Cancelado'}
                            </span>
                            {t.status === 'VALID' && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    disabled={markingId === t.id}
                                    onClick={() => void handleMarkUsed(t.id)}
                                >
                                    {markingId === t.id ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                        'Marcar como usada'
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Main Page ─── */
export default function DoorCheckPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { currentEvent } = useEvent();
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [overlay, setOverlay] = useState<OverlayData | null>(null);
    const [validatedCount, setValidatedCount] = useState(0);
    const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleScanResult = useCallback((data: OverlayData) => {
        setOverlay(data);
        if (data.result === 'valid') {
            setValidatedCount((c) => c + 1);
        }
        if (overlayTimer.current) clearTimeout(overlayTimer.current);
        overlayTimer.current = setTimeout(() => setOverlay(null), 3500);
    }, []);

    useEffect(() => {
        return () => {
            if (overlayTimer.current) clearTimeout(overlayTimer.current);
        };
    }, []);

    if (!eventId) return null;

    return (
        <div className="door-check">
            {/* Header */}
            <div className="door-check__header">
                <div className="door-check__header-row">
                    <div>
                        <div className="door-check__event-label">Evento activo</div>
                        <div className="door-check__event-name">
                            {currentEvent?.name ?? 'Evento'}
                        </div>
                    </div>
                    <div className="door-check__stats">
                        <div style={{ textAlign: 'right' }}>
                            <div className="door-check__validated-label">Validados (sesión)</div>
                            <div className="door-check__validated-count">{validatedCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="door-check__modes">
                <button
                    className={`door-check__mode-btn ${mode === 'scan' ? 'door-check__mode-btn--active' : ''}`}
                    onClick={() => setMode('scan')}
                >
                    <FontAwesomeIcon icon={faCamera} /> Escanear QR
                </button>
                <button
                    className={`door-check__mode-btn ${mode === 'manual' ? 'door-check__mode-btn--active' : ''}`}
                    onClick={() => setMode('manual')}
                >
                    <FontAwesomeIcon icon={faKeyboard} /> Buscar por cédula
                </button>
            </div>

            {/* Content */}
            {mode === 'scan' ? (
                <div
                    style={{
                        position: 'relative',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <QrScannerView eventId={eventId} onResult={handleScanResult} />
                    {overlay && <ResultOverlay data={overlay} />}
                </div>
            ) : (
                <ManualSearchView eventId={eventId} />
            )}
        </div>
    );
}

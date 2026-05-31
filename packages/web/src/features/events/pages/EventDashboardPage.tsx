import {
    faUsers,
    faCalendarAlt,
    faClock,
    faMapMarkerAlt,
    faUserTag,
    faChartLine,
    faTicketAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useEvent } from '../context/EventContext';

// Mini SVG Line Chart
const SalesChart = ({ data, color = 'var(--primary)' }: { data: number[]; color?: string }) => {
    const max = Math.max(...data);
    const W = 600;
    const H = 140;
    const pad = 8;
    const stepX = (W - pad * 2) / (data.length - 1);
    const points = data.map((v, i) => [
        pad + i * stepX,
        H - pad - (v / max) * (H - pad * 2 - 12) - 6,
    ]);
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');
    const areaPath = linePath + ` L${W - pad} ${H - pad} L${pad} ${H - pad} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
            <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((t) => (
                <line
                    key={t}
                    x1={pad}
                    x2={W - pad}
                    y1={H * t}
                    y2={H * t}
                    stroke="var(--border)"
                    strokeDasharray="3 4"
                    strokeWidth="1"
                />
            ))}
            <path d={areaPath} fill="url(#g1)" />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
            {points.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} />
            ))}
        </svg>
    );
};

export function EventDashboardPage() {
    const { currentEvent, eventRole } = useEvent();

    if (!currentEvent) return null;

    // Dates formatting
    const eventDate = new Date(currentEvent.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
    });

    const startTime = new Date(currentEvent.startTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const endTime = new Date(currentEvent.endTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Dummy data for the SVG Sales Chart (modeled from example/ui.jsx)
    const salesData = [12, 18, 15, 25, 30, 45, 40, 55, 62, 78, 70, 85, 95, 120];

    // Role translations
    const getRoleLabel = (role: string | null) => {
        if (!role) return 'Invitado';
        const uRole = role.toUpperCase();
        if (uRole === 'ADMIN' || uRole === 'ORGANIZER') return 'ORGANIZADOR / ADMINISTRADOR';
        if (uRole === 'COLLABORATOR') return 'COLABORADOR (TAQUILLA)';
        if (uRole === 'SCANNER') return 'SCANNER (VERIFICADOR)';
        return role;
    };

    return (
        <div>
            {/* KPI grid overview */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <div className="card kpi" style={{ padding: 18, background: 'var(--bg-elevated)' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <span className="text-secondary text-small" style={{ fontSize: 12 }}>
                                Capacidad Máxima
                            </span>
                            <div
                                style={{
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    marginTop: 4,
                                }}
                            >
                                {currentEvent.maxCapacity}
                            </div>
                        </div>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'var(--secondary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--secondary)',
                            }}
                        >
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                    </div>
                </div>

                <div className="card kpi" style={{ padding: 18, background: 'var(--bg-elevated)' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <span className="text-secondary text-small" style={{ fontSize: 12 }}>
                                Estado del Evento
                            </span>
                            <div style={{ marginTop: 6 }}>
                                <span
                                    className={`badge ${
                                        currentEvent.status === 'ACTIVE'
                                            ? 'success'
                                            : currentEvent.status === 'CANCELLED'
                                              ? 'danger'
                                              : 'primary'
                                    }`}
                                    style={{
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                    }}
                                >
                                    {currentEvent.status === 'ACTIVE'
                                        ? 'ACTIVO'
                                        : currentEvent.status === 'CANCELLED'
                                          ? 'CANCELADO'
                                          : 'BORRADOR'}
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'var(--primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                            }}
                        >
                            <FontAwesomeIcon icon={faCalendarAlt} />
                        </div>
                    </div>
                </div>

                <div className="card kpi" style={{ padding: 18, background: 'var(--bg-elevated)' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <span className="text-secondary text-small" style={{ fontSize: 12 }}>
                                Tu Rol Contextual
                            </span>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: 'var(--secondary-dark)',
                                    marginTop: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <FontAwesomeIcon icon={faUserTag} />
                                {getRoleLabel(eventRole)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* General detailed info */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 20,
                }}
            >
                {/* Event Summary Card */}
                <div
                    className="card elevated"
                    style={{ padding: 20, border: '1px solid var(--border)' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ height: 180, borderRadius: 10, overflow: 'hidden' }}>
                            <img
                                src={currentEvent.imageUrl}
                                alt={currentEvent.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        <div>
                            <h2
                                style={{
                                    fontSize: 22,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: 10,
                                    fontFamily: 'var(--font-sans)',
                                }}
                            >
                                {currentEvent.name}
                            </h2>

                            <p
                                style={{
                                    fontSize: 14.5,
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.6,
                                    marginBottom: 16,
                                    whiteSpace: 'pre-line',
                                }}
                            >
                                {currentEvent.description}
                            </p>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                    fontSize: 14,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faCalendarAlt}
                                        style={{ color: 'var(--primary)', width: 16 }}
                                    />
                                    <span>{eventDate}</span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faClock}
                                        style={{ color: 'var(--primary)', width: 16 }}
                                    />
                                    <span>
                                        Desde las {startTime} hasta las {endTime}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={faMapMarkerAlt}
                                        style={{ color: 'var(--primary)', width: 16, marginTop: 3 }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {currentEvent.location}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12.5,
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {currentEvent.address}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Placeholder Graphic Card */}
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
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 18,
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        margin: 0,
                                    }}
                                >
                                    Monitoreo de Ventas
                                </h3>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--text-secondary)',
                                        margin: '2px 0 0',
                                    }}
                                >
                                    Ingresos proyectados (Simulación)
                                </p>
                            </div>
                            <span
                                className="badge"
                                style={{
                                    background: 'var(--secondary-light)',
                                    color: 'var(--secondary-dark)',
                                    fontWeight: 600,
                                    fontSize: 11,
                                }}
                            >
                                <FontAwesomeIcon icon={faChartLine} style={{ marginRight: 4 }} />
                                EN TIEMPO REAL
                            </span>
                        </div>

                        <div style={{ margin: '20px 0' }}>
                            <SalesChart data={salesData} color="var(--secondary)" />
                        </div>
                    </div>

                    <div
                        style={{
                            background: 'var(--bg-base)',
                            borderRadius: 'var(--r-lg)',
                            padding: 14,
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={faTicketAlt} />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    Entradas vendidas: 0 / {currentEvent.maxCapacity}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                                    Los reportes de ventas se desbloquearán al iniciar la preventa.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

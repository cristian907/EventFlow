import { faSpinner, faExclamationTriangle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useReducer } from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';

import { useEvent } from '../context/EventContext';
import { eventService } from '../services/eventService';

type FetchState = { isLoading: boolean; error: string | null };
type FetchAction = { type: 'SUCCESS' } | { type: 'ERROR'; message: string } | { type: 'RESET' };

function fetchReducer(_state: FetchState, action: FetchAction): FetchState {
    switch (action.type) {
        case 'RESET':
            return { isLoading: true, error: null };
        case 'SUCCESS':
            return { isLoading: false, error: null };
        case 'ERROR':
            return { isLoading: false, error: action.message };
    }
}

export function EventDetailPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { setEventContext, eventRole, currentEvent } = useEvent();

    const [{ isLoading, error }, dispatch] = useReducer(fetchReducer, {
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        if (!eventId) return;

        let isMounted = true;

        eventService
            .getEventDetail(eventId)
            .then((res) => {
                if (isMounted) {
                    setEventContext(res.event, res.eventRole);
                    dispatch({ type: 'SUCCESS' });
                }
            })
            .catch((err: unknown) => {
                if (isMounted) {
                    const message =
                        (err as { response?: { data?: { message?: string } } })?.response?.data
                            ?.message || 'Error al cargar los detalles del evento.';
                    dispatch({ type: 'ERROR', message });
                }
            });

        return () => {
            isMounted = false;
            dispatch({ type: 'RESET' });
            setEventContext(null, null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // Redirect to sub-dashboard if matching root /events/:eventId exactly
    useEffect(() => {
        if (!eventId || !eventRole) return;
        const currentPath = location.pathname.replace(/\/$/, '');
        if (currentPath === `/events/${eventId}`) {
            const role = eventRole.toUpperCase();
            if (role === 'ADMIN' || role === 'ORGANIZER') {
                void navigate(`/events/${eventId}/dashboard`, { replace: true });
            } else if (role === 'COLLABORATOR') {
                void navigate(`/events/${eventId}/sales`, { replace: true });
            } else if (role === 'SCANNER') {
                void navigate(`/events/${eventId}/door-check`, { replace: true });
            } else {
                void navigate('/events', { replace: true });
            }
        }
    }, [eventId, eventRole, location.pathname, navigate]);

    // Frontend nested route guard / permission protection
    useEffect(() => {
        if (!eventRole || !eventId) return;

        const path = location.pathname;
        const role = eventRole.toUpperCase();

        const isDashboardPath = path.endsWith('/dashboard');
        const isStaffPath = path.endsWith('/staff');
        const isTicketsPath = path.endsWith('/tickets');
        const isConfigPath = path.endsWith('/config');
        const isSalesPath = path.endsWith('/sales');
        const isDoorCheckPath = path.endsWith('/door-check');

        const isAdminOrOrganizer = role === 'ADMIN' || role === 'ORGANIZER';

        const getDefaultPageForRole = (roleStr: string) => {
            const r = roleStr.toUpperCase();
            if (r === 'ADMIN' || r === 'ORGANIZER') return `/events/${eventId}/dashboard`;
            if (r === 'COLLABORATOR') return `/events/${eventId}/sales`;
            if (r === 'SCANNER') return `/events/${eventId}/door-check`;
            return '/events';
        };

        // Staff / Tickets / Config / Dashboard require ADMIN/ORGANIZER
        if (
            (isDashboardPath || isStaffPath || isTicketsPath || isConfigPath) &&
            !isAdminOrOrganizer
        ) {
            void navigate(getDefaultPageForRole(role), { replace: true });
        }

        // Sales requires ADMIN/ORGANIZER/COLLABORATOR
        if (isSalesPath && !isAdminOrOrganizer && role !== 'COLLABORATOR') {
            void navigate(getDefaultPageForRole(role), { replace: true });
        }

        // Door check requires ADMIN/ORGANIZER/SCANNER
        if (isDoorCheckPath && !isAdminOrOrganizer && role !== 'SCANNER') {
            void navigate(getDefaultPageForRole(role), { replace: true });
        }
    }, [location.pathname, eventRole, eventId, navigate]);

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
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    size="3x"
                    style={{ color: 'var(--primary)', marginBottom: 16 }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                    Cargando espacio de trabajo del evento...
                </p>
            </div>
        );
    }

    if (error || !currentEvent) {
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
                    Acceso Denegado
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                    {error ||
                        'No tienes permisos para acceder a este evento o el evento no existe.'}
                </p>
                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        void navigate('/events');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Volver a Eventos
                </button>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <Outlet />
        </div>
    );
}

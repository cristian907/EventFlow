import {
    faChartLine,
    faCalendarAlt,
    faInbox,
    faReceipt,
    faQrcode,
    faUsers,
    faCog,
    faSignOutAlt,
    faBell,
    faBars,
    faChevronRight,
    IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';

import { useAuth } from '../features/auth/context/AuthContext';

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: IconDefinition;
    group: 'operación' | 'administración';
    roleRequired?: 'ADMIN';
}

const NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: faChartLine,
        group: 'operación',
    },
    { id: 'events', label: 'Eventos', path: '/events', icon: faCalendarAlt, group: 'operación' },
    {
        id: 'comprobantes',
        label: 'Comprobantes',
        path: '/comprobantes',
        icon: faInbox,
        group: 'operación',
    },
    {
        id: 'ventas',
        label: 'Ventas taquilla',
        path: '/ventas',
        icon: faReceipt,
        group: 'operación',
    },
    {
        id: 'verificacion',
        label: 'Verif. puerta',
        path: '/verificacion',
        icon: faQrcode,
        group: 'operación',
    },
    {
        id: 'usuarios',
        label: 'Usuarios',
        path: '/admin/users',
        icon: faUsers,
        group: 'administración',
        roleRequired: 'ADMIN',
    },
    { id: 'config', label: 'Configuración', path: '/config', icon: faCog, group: 'administración' },
];

export function Layout() {
    const { user, isLoading, logoutUser } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Safe side-effect redirect
    useEffect(() => {
        if (!isLoading && !user) {
            void navigate('/login', { replace: true });
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div
                style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-base)',
                    fontFamily: 'var(--font-sans)',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            border: '4px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px',
                        }}
                    />
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Cargando aplicación...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const initials = user.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Filter nav items based on user role
    const filteredNav = NAV_ITEMS.filter((item) => {
        if (item.roleRequired === 'ADMIN' && user.role !== 'ADMIN') {
            return false;
        }
        return true;
    });

    const groupedNav = filteredNav.reduce(
        (acc, n) => {
            (acc[n.group] = acc[n.group] || []).push(n);
            return acc;
        },
        {} as Record<string, NavItem[]>,
    );

    // Dynamically resolve breadcrumbs
    const crumbs = (): string[] => {
        const path = location.pathname;
        if (path.startsWith('/dashboard')) return ['Inicio', 'Dashboard'];
        if (path.startsWith('/events')) return ['Inicio', 'Eventos'];
        if (path.startsWith('/comprobantes')) return ['Inicio', 'Cola de comprobantes'];
        if (path.startsWith('/ventas')) return ['Inicio', 'Ventas en taquilla'];
        if (path.startsWith('/verificacion')) return ['Inicio', 'Verificación en puerta'];
        if (path.startsWith('/admin/users')) return ['Inicio', 'Administración', 'Usuarios'];
        if (path.startsWith('/config')) return ['Inicio', 'Configuración'];
        return ['Inicio'];
    };

    const handleLogout = () => {
        logoutUser()
            .then(() => {
                void navigate('/login', { replace: true });
            })
            .catch((err) => {
                console.error('Logout error:', err);
            });
    };

    return (
        <div className="app-shell">
            {/* Sidebar Desktop & Mobile */}
            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="logo">
                    <div className="logo-mark">E</div>
                    <div>
                        <div className="logo-name">Event Flow</div>
                        <div className="logo-sub">Gestión de Eventos</div>
                    </div>
                </div>

                <nav className="nav">
                    {Object.entries(groupedNav).map(([group, items]) => (
                        <React.Fragment key={group}>
                            <div className="nav-group-label">{group}</div>
                            {items.map((n) => {
                                const isActive = location.pathname === n.path;
                                return (
                                    <Link
                                        key={n.id}
                                        to={n.path}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <FontAwesomeIcon icon={n.icon} style={{ width: 16 }} />
                                        {n.label}
                                    </Link>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Exchange Rate indicator */}
                <div className="rate-indicator">
                    <div className="rate-label">Tasa USD/Bs. activa</div>
                    <div className="rate-value mono">
                        36.50{' '}
                        <span
                            style={{
                                color: 'var(--text-secondary)',
                                fontWeight: 400,
                                fontSize: 12,
                            }}
                        >
                            Bs.
                        </span>
                    </div>
                    <div className="rate-time">Actualizado hoy</div>
                </div>

                {/* Profile Pill */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="profile-pill"
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        <div className="avatar">{initials}</div>
                        <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                            <div
                                className="name"
                                style={{
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }}
                            >
                                {user.fullName}
                            </div>
                            <div
                                className="role"
                                style={{
                                    fontSize: 10,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {user.role}
                            </div>
                        </div>
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            size="xs"
                            style={{
                                color: 'var(--text-secondary)',
                                transform: profileMenuOpen ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.15s',
                            }}
                        />
                    </button>

                    {profileMenuOpen && (
                        <>
                            <div
                                onClick={() => setProfileMenuOpen(false)}
                                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                            />
                            <div
                                className="card"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: '52px',
                                    padding: 6,
                                    zIndex: 11,
                                    background: 'var(--bg-elevated)',
                                    boxShadow: 'var(--shadow-md)',
                                }}
                            >
                                <button
                                    onClick={handleLogout}
                                    className="nav-item"
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 6,
                                    }}
                                >
                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                    Cerrar sesión
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* Main Area */}
            <main className="main">
                <header className="topbar">
                    <div className="row" style={{ gap: 12 }}>
                        <button
                            className="btn btn-icon btn-ghost mobile-toggle"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ display: 'flex', border: 'none', background: 'none' }}
                        >
                            <FontAwesomeIcon icon={faBars} size="lg" />
                        </button>
                        <div className="breadcrumb">
                            {crumbs().map((c, i, arr) => (
                                <React.Fragment key={i}>
                                    <span className={i === arr.length - 1 ? 'current' : ''}>
                                        {c}
                                    </span>
                                    {i < arr.length - 1 && <span className="sep">›</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                        <button
                            className="btn btn-icon btn-ghost"
                            style={{ border: 'none', background: 'none' }}
                        >
                            <FontAwesomeIcon icon={faBell} />
                        </button>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {initials}
                        </div>
                    </div>
                </header>

                <div className="page">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.35)',
                        zIndex: 25,
                    }}
                />
            )}
        </div>
    );
}

import {
    faUser,
    faSun,
    faMoon,
    faLaptop,
    faSpinner,
    faCheckCircle,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import { useAuth } from '../../auth/context/AuthContext';

export function UserSettingsPage() {
    const { user, updateUserTheme } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!user) {
        return null;
    }

    const currentTheme = user.theme || 'light';

    const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
        if (isSaving || currentTheme === theme) return;
        setIsSaving(true);
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
            await updateUserTheme(theme);
            setSuccessMessage('Preferencia de tema actualizada.');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setErrorMessage('No se pudo guardar la preferencia de tema.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            style={{
                fontFamily: 'var(--font-sans)',
                maxWidth: 640,
                margin: '0 auto',
                padding: '16px 0',
            }}
        >
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <h1
                    className="page-title"
                    style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <FontAwesomeIcon icon={faUser} style={{ color: 'var(--primary)' }} />
                    Ajustes de Perfil
                </h1>
                <p
                    className="page-subtitle"
                    style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                >
                    Administra tus preferencias de cuenta e interfaz de usuario
                </p>
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

            {errorMessage && (
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
                    <span>{errorMessage}</span>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Account Details Card */}
                <div className="card elevated" style={{ padding: 24 }}>
                    <h3
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 18,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: 10,
                        }}
                    >
                        Información del Usuario
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 14,
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)' }}>Nombre Completo</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {user.fullName}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 14,
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Correo Electrónico
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {user.email}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 14,
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Número de Teléfono
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {user.phoneNumber}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 14,
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)' }}>Rol de Cuenta</span>
                            <span
                                className={`badge ${user.role === 'ADMIN' ? 'danger' : 'primary'}`}
                                style={{ fontWeight: 600 }}
                            >
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Theme Selector Card */}
                <div className="card elevated" style={{ padding: 24 }}>
                    <h3
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 6,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: 10,
                        }}
                    >
                        Preferencia de Interfaz (Tema)
                    </h3>
                    <p
                        style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            marginBottom: 20,
                        }}
                    >
                        Personaliza cómo se visualiza la plataforma EventFlow en tu dispositivo
                    </p>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 16,
                        }}
                    >
                        {/* Light Theme Option */}
                        <button
                            type="button"
                            onClick={() => void handleThemeChange('light')}
                            disabled={isSaving}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 12,
                                padding: '20px 10px',
                                border:
                                    currentTheme === 'light'
                                        ? '2px solid var(--primary)'
                                        : '1px solid var(--border)',
                                borderRadius: 'var(--r-lg)',
                                background:
                                    currentTheme === 'light'
                                        ? 'var(--primary-light)'
                                        : 'var(--bg-elevated)',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faSun}
                                size="lg"
                                style={{
                                    color:
                                        currentTheme === 'light'
                                            ? 'var(--primary)'
                                            : 'var(--text-secondary)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color:
                                        currentTheme === 'light'
                                            ? 'var(--primary-dark)'
                                            : 'var(--text-primary)',
                                }}
                            >
                                Claro
                            </span>
                        </button>

                        {/* Dark Theme Option */}
                        <button
                            type="button"
                            onClick={() => void handleThemeChange('dark')}
                            disabled={isSaving}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 12,
                                padding: '20px 10px',
                                border:
                                    currentTheme === 'dark'
                                        ? '2px solid var(--primary)'
                                        : '1px solid var(--border)',
                                borderRadius: 'var(--r-lg)',
                                background:
                                    currentTheme === 'dark'
                                        ? 'var(--primary-light)'
                                        : 'var(--bg-elevated)',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faMoon}
                                size="lg"
                                style={{
                                    color:
                                        currentTheme === 'dark'
                                            ? 'var(--primary)'
                                            : 'var(--text-secondary)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color:
                                        currentTheme === 'dark'
                                            ? 'var(--primary-dark)'
                                            : 'var(--text-primary)',
                                }}
                            >
                                Oscuro
                            </span>
                        </button>

                        {/* System Theme Option */}
                        <button
                            type="button"
                            onClick={() => void handleThemeChange('system')}
                            disabled={isSaving}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 12,
                                padding: '20px 10px',
                                border:
                                    currentTheme === 'system'
                                        ? '2px solid var(--primary)'
                                        : '1px solid var(--border)',
                                borderRadius: 'var(--r-lg)',
                                background:
                                    currentTheme === 'system'
                                        ? 'var(--primary-light)'
                                        : 'var(--bg-elevated)',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faLaptop}
                                size="lg"
                                style={{
                                    color:
                                        currentTheme === 'system'
                                            ? 'var(--primary)'
                                            : 'var(--text-secondary)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color:
                                        currentTheme === 'system'
                                            ? 'var(--primary-dark)'
                                            : 'var(--text-primary)',
                                }}
                            >
                                Sistema
                            </span>
                        </button>
                    </div>

                    {isSaving && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                marginTop: 16,
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                style={{ color: 'var(--primary)' }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                Guardando preferencia...
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { SystemSettingsType } from '@eventflow/shared';
import {
    faCog,
    faExclamationTriangle,
    faCheckCircle,
    faSpinner,
    faSave,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/context/AuthContext';
import { settingsService } from '../services/settingsService';

export function GeneralConfigPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Frontend Route Guard: only global ADMIN can configure settings
    useEffect(() => {
        if (currentUser && currentUser.role !== 'ADMIN') {
            void navigate('/', { replace: true });
        }
    }, [currentUser, navigate]);

    // UI & API states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [defaultRateSource, setDefaultRateSource] =
        useState<SystemSettingsType['defaultRateSource']>('CUSTOM');

    // Fetch initial settings
    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await settingsService.getSettings();
            setDefaultRateSource(data.defaultRateSource);
        } catch (err: unknown) {
            console.error('Error fetching settings:', err);
            setError('No se pudieron obtener las configuraciones globales.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchSettings();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchSettings]);

    // Handle Save Settings
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const updated = await settingsService.updateSettings({
                defaultRateSource,
            });
            setDefaultRateSource(updated.defaultRateSource);
            setSuccessMessage('Las configuraciones globales han sido guardadas con éxito.');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            console.error('Error saving settings:', err);
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Ocurrió un error al guardar los ajustes.';
            setError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div
                style={{
                    height: '50vh',
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
                    size="2x"
                    style={{ color: 'var(--primary)', marginBottom: 12 }}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Cargando configuración del sistema...
                </p>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 640, margin: '0 auto' }}>
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
                    <FontAwesomeIcon icon={faCog} style={{ color: 'var(--primary)' }} />
                    Configuración General
                </h1>
                <p
                    className="page-subtitle"
                    style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                >
                    Administra los parámetros y valores por defecto del sistema
                </p>
            </div>

            {/* Error Banner */}
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

            {/* Success Banner */}
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

            {/* Settings Form Card */}
            <form
                onSubmit={(e) => void handleSave(e)}
                className="card elevated"
                style={{ padding: 24 }}
            >
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
                    Parámetros de Tasa Cambiaria
                </h3>

                <div className="field" style={{ marginBottom: 20 }}>
                    <label className="field-label" style={{ fontWeight: 600, marginBottom: 8 }}>
                        Origen de Tasa de Cambio Predeterminada
                    </label>
                    <select
                        className="select"
                        value={defaultRateSource}
                        onChange={(e) =>
                            setDefaultRateSource(
                                e.target.value as SystemSettingsType['defaultRateSource'],
                            )
                        }
                        style={{ maxWidth: '100%' }}
                    >
                        <option value="CUSTOM">Tasa Manual (CUSTOM - Por Evento)</option>
                        <option value="USD_BCV">Tasa Oficial USD (BCV)</option>
                        <option value="EUR_BCV">Tasa Oficial EUR (BCV)</option>
                        <option value="USDT_PARALELO">Tasa Paralela (USDT / Paralelo)</option>
                        <option value="NONE">
                            Sin predeterminar (Obliga a elegir una al crear)
                        </option>
                    </select>

                    <p className="field-hint" style={{ marginTop: 8, lineHeight: 1.5 }}>
                        Define el comportamiento de tasa de cambio al crear un nuevo evento.
                        <br />
                        Si seleccionas **Sin predeterminar**, el formulario de creación de eventos
                        obligará al administrador a seleccionar una opción explícitamente en lugar
                        de autocompletarla.
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: 24,
                        borderTop: '1px solid var(--border)',
                        paddingTop: 16,
                    }}
                >
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSaving}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 20px',
                        }}
                    >
                        {isSaving ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faSave} />
                                Guardar Ajustes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

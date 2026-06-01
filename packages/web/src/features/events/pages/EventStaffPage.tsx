import { StaffMemberType } from '@eventflow/shared';
import {
    faSearch,
    faUserCheck,
    faExclamationTriangle,
    faSpinner,
    faChevronLeft,
    faChevronRight,
    faUserSlash,
    faPlus,
    faEdit,
    faTimes,
    faEnvelope,
    faPhone,
    faLock,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/AuthContext';
import { staffService } from '../services/staffService';

const ROLE_DESCRIPTIONS: Record<string, string> = {
    admin: 'Administrador de Evento. Tiene control total de la gestión del evento, incluyendo la configuración de entradas, el registro de personal y la supervisión de las ventas.',
    collaborator:
        'Colaborador de Ventas. Puede ver la información general del evento y registrar transacciones de venta de boletos en la plataforma.',
    scanner:
        'Verificador de Puerta / Escáner. Encargado del control de acceso en el evento. Puede escanear y validar los boletos de los asistentes en puerta.',
};

export function EventStaffPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { user: currentUser } = useAuth();

    // API States
    const [members, setMembers] = useState<StaffMemberType[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [activeAdminsCount, setActiveAdminsCount] = useState(0);

    // Filter/Search States
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal UI States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMemberType | null>(null);
    const [deactivatingMember, setDeactivatingMember] = useState<StaffMemberType | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Add Form States
    const [addForm, setAddForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'collaborator' as 'admin' | 'collaborator' | 'scanner',
        password: '',
    });
    const [addFormError, setAddFormError] = useState<string | null>(null);

    // Realtime email checking states
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState<boolean | null>(null);
    const [suggestions, setSuggestions] = useState<
        Array<{ fullName: string; email: string; phoneNumber: string }>
    >([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Handler to select a typed email suggestion
    const handleSelectSuggestion = (s: {
        fullName: string;
        email: string;
        phoneNumber: string;
    }) => {
        setEmailExists(true);
        setShowSuggestions(false);
        setAddForm({
            ...addForm,
            email: s.email,
            fullName: s.fullName,
            phoneNumber: s.phoneNumber,
            password: '',
        });
    };

    // Email checking effect
    useEffect(() => {
        if (!isAddOpen || !eventId) {
            const timer = setTimeout(() => {
                setEmailExists(null);
                setCheckingEmail(false);
                setSuggestions([]);
                setShowSuggestions(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const cleanEmail = addForm.email.trim();
        if (!cleanEmail) {
            const timer = setTimeout(() => {
                setEmailExists(null);
                setCheckingEmail(false);
                setSuggestions([]);
                setShowSuggestions(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailRegex.test(cleanEmail);

        const timer = setTimeout(() => {
            setCheckingEmail(true);
            void (async () => {
                try {
                    const res = (await staffService.searchUserByEmail(eventId, cleanEmail)) as {
                        exists: boolean;
                        user?: { fullName: string; email: string; phoneNumber: string };
                        suggestions?: Array<{
                            fullName: string;
                            email: string;
                            phoneNumber: string;
                        }>;
                    };
                    setSuggestions(res.suggestions || []);
                    if (res.suggestions && res.suggestions.length > 0 && !res.exists) {
                        setShowSuggestions(true);
                    } else {
                        setShowSuggestions(false);
                    }

                    if (res.exists && res.user) {
                        const existingUser = res.user;
                        setEmailExists(true);
                        setAddForm((prev) => ({
                            ...prev,
                            fullName: existingUser.fullName,
                            phoneNumber: existingUser.phoneNumber,
                            password: '',
                        }));
                        setShowSuggestions(false);
                    } else {
                        // Only declare it doesn't exist if they finished typing a valid email
                        if (isEmailValid) {
                            setEmailExists(false);
                        } else {
                            setEmailExists(null);
                        }
                    }
                } catch {
                    setEmailExists(null);
                    setSuggestions([]);
                    setShowSuggestions(false);
                } finally {
                    setCheckingEmail(false);
                }
            })();
        }, 400);

        return () => clearTimeout(timer);
    }, [addForm.email, isAddOpen, eventId]);

    // Edit Form States
    const [editForm, setEditForm] = useState({
        role: 'collaborator' as 'admin' | 'collaborator' | 'scanner',
        status: 'active' as 'active' | 'inactive',
    });
    const [editFormError, setEditFormError] = useState<string | null>(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // Fetch staff list
    const fetchStaff = useCallback(async () => {
        if (!eventId) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await staffService.listStaff(eventId, {
                page,
                limit,
                search: debouncedSearch || undefined,
            });
            setMembers(response.members);
            setTotal(response.total);
            setTotalPages(response.totalPages);
            setActiveAdminsCount(response.activeAdminsCount);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Error al obtener la lista del personal.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [eventId, page, limit, debouncedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchStaff();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchStaff]);

    // Handle Add Staff Submit
    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId) return;

        // Basic Client Validation
        if (!addForm.fullName.trim()) return setAddFormError('El nombre completo es obligatorio');
        if (!addForm.email.trim()) return setAddFormError('El correo electrónico es obligatorio');
        if (!addForm.phoneNumber.trim())
            return setAddFormError('El número de teléfono es obligatorio');
        if (addForm.phoneNumber.replace(/\D/g, '').length < 10) {
            return setAddFormError('El número de teléfono debe tener al menos 10 dígitos');
        }
        if (emailExists !== true && addForm.password.length < 6) {
            return setAddFormError('La contraseña debe tener al menos 6 caracteres');
        }

        setIsSaving(true);
        setAddFormError(null);
        void (async () => {
            try {
                await staffService.addStaff(eventId, addForm);
                setIsAddOpen(false);
                setEmailExists(null);
                setAddForm({
                    fullName: '',
                    email: '',
                    phoneNumber: '',
                    role: 'collaborator',
                    password: '',
                });
                setSuccessMessage('Miembro del staff agregado con éxito.');
                void fetchStaff();

                setTimeout(() => setSuccessMessage(null), 4000);
            } catch (err: unknown) {
                const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message || 'Error al agregar el miembro del staff.';
                setAddFormError(msg);
            } finally {
                setIsSaving(false);
            }
        })();
    };

    // Open Edit Modal
    const openEditModal = (member: StaffMemberType) => {
        setEditingMember(member);
        setEditForm({
            role:
                member.role === 'organizer'
                    ? 'admin'
                    : (member.role as 'admin' | 'collaborator' | 'scanner'),
            status: member.status as 'active' | 'inactive',
        });
        setEditFormError(null);
    };

    // Handle Edit Staff Submit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !editingMember) return;

        setIsSaving(true);
        setEditFormError(null);
        void (async () => {
            try {
                await staffService.updateStaff(eventId, editingMember.id, editForm);
                setEditingMember(null);
                setSuccessMessage('Miembro del staff actualizado con éxito.');
                void fetchStaff();

                setTimeout(() => setSuccessMessage(null), 4000);
            } catch (err: unknown) {
                const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message || 'Error al actualizar el miembro del staff.';
                setEditFormError(msg);
            } finally {
                setIsSaving(false);
            }
        })();
    };

    // Handle Logical Deactivation
    const handleDeactivateConfirm = () => {
        if (!eventId || !deactivatingMember) return;

        setIsSaving(true);
        setError(null);
        void (async () => {
            try {
                await staffService.removeStaff(eventId, deactivatingMember.id);
                setDeactivatingMember(null);
                setSuccessMessage(`El miembro del staff ha sido dado de baja de forma lógica.`);
                void fetchStaff();

                setTimeout(() => setSuccessMessage(null), 4000);
            } catch (err: unknown) {
                const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message || 'Error al dar de baja al miembro del staff.';
                setError(msg);
            } finally {
                setIsSaving(false);
            }
        })();
    };

    // Check if member is the current user
    const isSelf = (member: StaffMemberType) => {
        return currentUser?.id === member.userId;
    };

    return (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* Header Section */}
            <div
                className="page-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h1
                        className="page-title"
                        style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                        Staff del Evento
                    </h1>
                    <p
                        className="page-subtitle"
                        style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                    >
                        {total} miembros registrados en total ·{' '}
                        {members.filter((m) => m.status === 'active').length} activos
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} />
                    Agregar Staff
                </button>
            </div>

            {/* Success and Global Error Banners */}
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
                        animation: 'fadeIn 0.15s ease-out',
                    }}
                >
                    <FontAwesomeIcon icon={faUserCheck} />
                    <span>{successMessage}</span>
                </div>
            )}

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
                        animation: 'fadeIn 0.15s ease-out',
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </div>
            )}

            {/* Search Filter Card */}
            <div
                className="card mb-4"
                style={{
                    padding: 14,
                    marginBottom: 20,
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border)',
                }}
            >
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        className="input"
                        placeholder="Buscar por nombre o correo electrónico..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%' }}
                    />
                    <FontAwesomeIcon
                        icon={faSearch}
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-disabled)',
                            pointerEvents: 'none',
                        }}
                    />
                </div>
            </div>

            {/* Staff Table Card */}
            <div
                className="table-wrap"
                style={{ boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--r-lg)' }}
            >
                {isLoading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            size="2x"
                            style={{ color: 'var(--primary)', marginBottom: 12 }}
                        />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            Cargando personal del evento...
                        </p>
                    </div>
                ) : members.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <FontAwesomeIcon
                            icon={faUserSlash}
                            size="2x"
                            style={{ color: 'var(--text-disabled)', marginBottom: 12 }}
                        />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            No se encontraron miembros del staff coincidentes.
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo electrónico</th>
                                <th>Teléfono</th>
                                <th>Rol de Evento</th>
                                <th>Estado</th>
                                <th style={{ width: 150 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m) => {
                                const initials = m.user.fullName
                                    .split(' ')
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase();

                                // Get beautiful colors for badges based on event role
                                let roleBadgeClass = 'secondary';
                                let roleLabel = 'COLABORADOR';
                                if (m.role === 'admin' || m.role === 'organizer') {
                                    roleBadgeClass = 'primary';
                                    roleLabel =
                                        m.role === 'organizer' ? 'ORGANIZADOR' : 'ADMINISTRADOR';
                                } else if (m.role === 'scanner') {
                                    roleBadgeClass = 'info';
                                    roleLabel = 'VERIFICADOR';
                                }

                                const selfLabel = isSelf(m);

                                return (
                                    <tr
                                        key={m.id}
                                        style={{
                                            transition: 'background-color 0.2s',
                                            opacity: m.status === 'inactive' ? 0.65 : 1,
                                        }}
                                    >
                                        <td>
                                            <div className="row" style={{ gap: 10 }}>
                                                <div
                                                    className="avatar"
                                                    style={{
                                                        background:
                                                            m.status === 'inactive'
                                                                ? 'var(--text-disabled)'
                                                                : m.role === 'admin' ||
                                                                    m.role === 'organizer'
                                                                  ? 'var(--primary)'
                                                                  : m.role === 'scanner'
                                                                    ? 'var(--text-primary)'
                                                                    : 'var(--secondary)',
                                                        color: '#fff',
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        transition: 'transform 0.2s',
                                                    }}
                                                >
                                                    {initials}
                                                </div>
                                                <span
                                                    className="fw-600"
                                                    style={{
                                                        fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                    }}
                                                >
                                                    {m.user.fullName} {selfLabel && '(Tú)'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-small" style={{ fontSize: 13 }}>
                                            {m.user.email}
                                        </td>
                                        <td
                                            className="text-small mono"
                                            style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}
                                        >
                                            {m.user.phoneNumber}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${roleBadgeClass}`}
                                                style={
                                                    m.role === 'scanner'
                                                        ? {
                                                              background: 'var(--text-secondary)',
                                                              color: '#fff',
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {roleLabel}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge dot ${m.status === 'active' && m.user.isActive !== false ? 'success' : 'default'}`}
                                            >
                                                {m.status === 'active' && m.user.isActive !== false
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </span>
                                            {m.user.isActive === false && (
                                                <span
                                                    className="badge danger"
                                                    style={{
                                                        marginLeft: 6,
                                                        fontSize: 10,
                                                        background: 'var(--danger)',
                                                        color: '#fff',
                                                        padding: '2px 6px',
                                                        borderRadius: 'var(--r-xs)',
                                                    }}
                                                    title="Esta cuenta de usuario ha sido desactivada globalmente"
                                                >
                                                    Suspendido
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {m.role === 'organizer' ? (
                                                    <span
                                                        className="text-small text-secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            color: 'var(--text-disabled)',
                                                            fontStyle: 'italic',
                                                            padding: '4px 8px',
                                                        }}
                                                    >
                                                        Creador / Propietario
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-ghost"
                                                            onClick={() => openEditModal(m)}
                                                            title="Editar rol y estado"
                                                            style={{
                                                                padding: '4px 8px',
                                                                color: 'var(--primary)',
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        {m.status === 'active' && (
                                                            <button
                                                                className="btn btn-sm btn-ghost"
                                                                onClick={() =>
                                                                    setDeactivatingMember(m)
                                                                }
                                                                title="Dar de baja de forma lógica"
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    color: 'var(--danger)',
                                                                }}
                                                                disabled={
                                                                    m.role === 'admin' &&
                                                                    activeAdminsCount <= 1
                                                                }
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faUserSlash}
                                                                />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 18,
                        padding: '0 8px',
                    }}
                >
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        style={{ opacity: page === 1 ? 0.5 : 1 }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} /> Anterior
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({total}{' '}
                        miembros)
                    </span>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        style={{ opacity: page === totalPages ? 0.5 : 1 }}
                    >
                        Siguiente <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            )}

            {/* 1. Modal: Agregar Staff */}
            {isAddOpen && (
                <div className="modal-backdrop" onClick={() => setIsAddOpen(false)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 560, animation: 'fadeIn 0.2s ease-out' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Agregar nuevo miembro al staff
                            </h3>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => setIsAddOpen(false)}
                                style={{ padding: 4 }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <p
                            style={{
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                marginBottom: 20,
                            }}
                        >
                            Si el correo ya está registrado en la base de datos, su cuenta se
                            reutilizará y se le vinculará al evento. Si no existe, se creará un
                            nuevo usuario con la contraseña inicial que definas a continuación.
                        </p>

                        <form onSubmit={handleAddSubmit}>
                            {addFormError && (
                                <div
                                    className="badge danger mb-4"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 'var(--r-lg)',
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 16,
                                    }}
                                >
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span>{addFormError}</span>
                                </div>
                            )}

                            <div
                                className="grid grid-2"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 16,
                                    marginBottom: 16,
                                }}
                            >
                                <div
                                    className="field"
                                    style={{ gridColumn: 'span 2', position: 'relative' }}
                                >
                                    <label
                                        className="field-label"
                                        style={{
                                            display: 'block',
                                            marginBottom: 6,
                                            fontSize: 13,
                                            fontWeight: 550,
                                        }}
                                    >
                                        Correo electrónico
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="input"
                                            type="email"
                                            placeholder="juan@ejemplo.com"
                                            value={addForm.email}
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, email: e.target.value })
                                            }
                                            style={{ paddingLeft: '32px' }}
                                            required
                                        />
                                        <FontAwesomeIcon
                                            icon={faEnvelope}
                                            style={{
                                                position: 'absolute',
                                                left: 10,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--text-disabled)',
                                                fontSize: 13,
                                            }}
                                        />
                                    </div>
                                    {checkingEmail && (
                                        <span
                                            style={{
                                                color: 'var(--text-disabled)',
                                                fontSize: 12,
                                                marginTop: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faSpinner} spin /> Buscando
                                            cuenta...
                                        </span>
                                    )}
                                    {!checkingEmail && emailExists === true && (
                                        <span
                                            style={{
                                                color: 'var(--success)',
                                                fontSize: 12,
                                                marginTop: 4,
                                                display: 'block',
                                            }}
                                        >
                                            ✓ Cuenta encontrada. Datos cargados y bloqueados.
                                        </span>
                                    )}
                                    {!checkingEmail && emailExists === false && (
                                        <span
                                            style={{
                                                color: 'var(--warning)',
                                                fontSize: 12,
                                                marginTop: 4,
                                                display: 'block',
                                            }}
                                        >
                                            ✦ Cuenta nueva. Registra los datos del usuario.
                                        </span>
                                    )}

                                    {/* Auto-complete Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div
                                            className="card"
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                zIndex: 50,
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--r-lg)',
                                                boxShadow: 'var(--shadow-md)',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                marginTop: '4px',
                                                padding: '6px',
                                            }}
                                        >
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s.email}
                                                    type="button"
                                                    className="nav-item"
                                                    onClick={() => handleSelectSuggestion(s)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '8px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        display: 'block',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-primary)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background =
                                                            'var(--bg-base)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background =
                                                            'transparent';
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 600 }}>
                                                        {s.fullName}
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: 'var(--text-secondary)',
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        {s.email}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="field" style={{ gridColumn: 'span 2' }}>
                                    <label
                                        className="field-label"
                                        style={{
                                            display: 'block',
                                            marginBottom: 6,
                                            fontSize: 13,
                                            fontWeight: 550,
                                        }}
                                    >
                                        Nombre completo
                                    </label>
                                    <input
                                        className="input"
                                        placeholder={
                                            emailExists === true
                                                ? 'Cargado de cuenta existente'
                                                : 'Ej. Juan Pérez'
                                        }
                                        value={addForm.fullName}
                                        onChange={(e) =>
                                            setAddForm({ ...addForm, fullName: e.target.value })
                                        }
                                        disabled={emailExists === true}
                                        required={emailExists !== true}
                                    />
                                </div>

                                <div className="field">
                                    <label
                                        className="field-label"
                                        style={{
                                            display: 'block',
                                            marginBottom: 6,
                                            fontSize: 13,
                                            fontWeight: 550,
                                        }}
                                    >
                                        Teléfono
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="input"
                                            placeholder={
                                                emailExists === true
                                                    ? 'Cargado de cuenta'
                                                    : 'Ej. 04141234567'
                                            }
                                            value={addForm.phoneNumber}
                                            onChange={(e) =>
                                                setAddForm({
                                                    ...addForm,
                                                    phoneNumber: e.target.value,
                                                })
                                            }
                                            style={{ paddingLeft: '32px' }}
                                            disabled={emailExists === true}
                                            required={emailExists !== true}
                                        />
                                        <FontAwesomeIcon
                                            icon={faPhone}
                                            style={{
                                                position: 'absolute',
                                                left: 10,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--text-disabled)',
                                                fontSize: 13,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="field">
                                    <label
                                        className="field-label"
                                        style={{
                                            display: 'block',
                                            marginBottom: 6,
                                            fontSize: 13,
                                            fontWeight: 550,
                                        }}
                                    >
                                        Contraseña Inicial (para cuentas nuevas)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="input"
                                            type="password"
                                            placeholder={
                                                emailExists === true
                                                    ? 'No requerida (usuario existente)'
                                                    : 'Mínimo 6 caracteres'
                                            }
                                            value={addForm.password}
                                            onChange={(e) =>
                                                setAddForm({ ...addForm, password: e.target.value })
                                            }
                                            style={{ paddingLeft: '32px' }}
                                            disabled={emailExists === true}
                                            required={emailExists !== true}
                                        />
                                        <FontAwesomeIcon
                                            icon={faLock}
                                            style={{
                                                position: 'absolute',
                                                left: 10,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: 'var(--text-disabled)',
                                                fontSize: 13,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="field" style={{ gridColumn: 'span 2' }}>
                                    <label
                                        className="field-label"
                                        style={{
                                            display: 'block',
                                            marginBottom: 6,
                                            fontSize: 13,
                                            fontWeight: 550,
                                        }}
                                    >
                                        Rol operativo en el Evento
                                    </label>
                                    <select
                                        className="select"
                                        value={addForm.role}
                                        onChange={(e) =>
                                            setAddForm({
                                                ...addForm,
                                                role: e.target.value as
                                                    | 'admin'
                                                    | 'collaborator'
                                                    | 'scanner',
                                            })
                                        }
                                        style={{ width: '100%' }}
                                    >
                                        <option value="collaborator">Colaborador (Ventas)</option>
                                        <option value="scanner">Verificador (Puerta)</option>
                                        <option value="admin">Administrador (Control total)</option>
                                    </select>

                                    {/* Dynamic Premium Description Card */}
                                    <div
                                        className="card mt-3"
                                        style={{
                                            background: 'var(--secondary-light)',
                                            borderColor: 'transparent',
                                            padding: 12,
                                            borderRadius: 'var(--r-lg)',
                                            marginTop: 10,
                                        }}
                                    >
                                        <div
                                            className="text-small fw-600"
                                            style={{
                                                color: 'var(--secondary-dark)',
                                                fontWeight: 600,
                                                marginBottom: 4,
                                                fontSize: 13,
                                            }}
                                        >
                                            Permisos del rol:
                                        </div>
                                        <div
                                            className="text-small"
                                            style={{
                                                color: 'var(--secondary-dark)',
                                                fontSize: 12.5,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {ROLE_DESCRIPTIONS[addForm.role]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                className="modal-actions"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 8,
                                    marginTop: 24,
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setIsAddOpen(false)}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving || checkingEmail}
                                >
                                    {isSaving ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : emailExists === true ? (
                                        'Asignar al Evento'
                                    ) : (
                                        'Crear y Asignar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Modal: Editar Staff */}
            {editingMember && (
                <div className="modal-backdrop" onClick={() => setEditingMember(null)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 460, animation: 'fadeIn 0.2s ease-out' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}
                            >
                                Editar miembro: {editingMember.user.fullName}
                            </h3>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => setEditingMember(null)}
                                style={{ padding: 4 }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            {editFormError && (
                                <div
                                    className="badge danger mb-4"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 'var(--r-lg)',
                                        fontSize: 13,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 16,
                                    }}
                                >
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span>{editFormError}</span>
                                </div>
                            )}

                            <div className="field" style={{ marginBottom: 16 }}>
                                <label
                                    className="field-label"
                                    style={{
                                        display: 'block',
                                        marginBottom: 6,
                                        fontSize: 13,
                                        fontWeight: 550,
                                    }}
                                >
                                    Rol operativo en el Evento
                                </label>
                                <select
                                    className="select"
                                    value={editForm.role}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            role: e.target.value as
                                                | 'admin'
                                                | 'collaborator'
                                                | 'scanner',
                                        })
                                    }
                                    style={{ width: '100%' }}
                                >
                                    <option value="collaborator">Colaborador (Ventas)</option>
                                    <option value="scanner">Verificador (Puerta)</option>
                                    <option value="admin">Administrador (Control total)</option>
                                </select>
                            </div>

                            <div className="field" style={{ marginBottom: 16 }}>
                                <label
                                    className="field-label"
                                    style={{
                                        display: 'block',
                                        marginBottom: 6,
                                        fontSize: 13,
                                        fontWeight: 550,
                                    }}
                                >
                                    Estado en el Evento
                                </label>
                                <select
                                    className="select"
                                    value={editForm.status}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            status: e.target.value as 'active' | 'inactive',
                                        })
                                    }
                                    style={{ width: '100%' }}
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo / Suspendido</option>
                                </select>

                                {/* Alert about removing the last admin in frontend */}
                                {editingMember.role === 'admin' &&
                                    editForm.role !== 'admin' &&
                                    activeAdminsCount <= 1 && (
                                        <div
                                            className="badge danger mt-3"
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 'var(--r-lg)',
                                                fontSize: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                marginTop: 10,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            <span>
                                                ¡Atención! Este es el único administrador del
                                                evento. Debes asignar otro administrador antes de
                                                poder degradar este rol.
                                            </span>
                                        </div>
                                    )}
                            </div>

                            {/* Dynamic Premium Description Card */}
                            <div
                                className="card mt-3"
                                style={{
                                    background: 'var(--bg-base)',
                                    borderColor: 'transparent',
                                    padding: 12,
                                    borderRadius: 'var(--r-lg)',
                                    marginBottom: 20,
                                }}
                            >
                                <div
                                    className="text-small fw-600"
                                    style={{
                                        color: 'var(--text-secondary)',
                                        fontWeight: 600,
                                        marginBottom: 4,
                                        fontSize: 13,
                                    }}
                                >
                                    Permisos del nuevo rol:
                                </div>
                                <div
                                    className="text-small"
                                    style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: 12.5,
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {ROLE_DESCRIPTIONS[editForm.role]}
                                </div>
                            </div>

                            <div
                                className="modal-actions"
                                style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setEditingMember(null)}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        isSaving ||
                                        (editingMember.role === 'admin' &&
                                            editForm.role !== 'admin' &&
                                            activeAdminsCount <= 1)
                                    }
                                >
                                    {isSaving ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Modal: Confirmación de Baja */}
            {deactivatingMember && (
                <div className="modal-backdrop" onClick={() => setDeactivatingMember(null)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 440, animation: 'fadeIn 0.2s ease-out' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                marginBottom: 8,
                                color: 'var(--text-primary)',
                            }}
                        >
                            ¿Dar de baja al miembro del staff?
                        </h3>

                        <p
                            style={{
                                fontSize: 14,
                                color: 'var(--text-secondary)',
                                marginBottom: 18,
                                lineHeight: 1.5,
                            }}
                        >
                            Estás a punto de suspender/desactivar el acceso de{' '}
                            <strong>{deactivatingMember.user.fullName}</strong> en este evento. Su
                            cuenta no será borrada físicamente y conservará su acceso a otros
                            eventos del sistema.
                        </p>

                        <div
                            className="card mt-2 mb-4"
                            style={{
                                background: 'var(--danger-light)',
                                borderColor: 'transparent',
                                padding: 12,
                                borderRadius: 'var(--r-lg)',
                                marginBottom: 20,
                            }}
                        >
                            <div
                                className="text-small fw-600"
                                style={{
                                    color: 'var(--danger)',
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    fontSize: 12.5,
                                }}
                            >
                                Efecto de la baja:
                            </div>
                            <div
                                className="text-small"
                                style={{
                                    color: 'var(--danger)',
                                    fontSize: 12.5,
                                    lineHeight: 1.4,
                                }}
                            >
                                Perderá el acceso de forma inmediata a los paneles operativos de
                                este evento (como ventas o verificación). Podrá ser reactivado en
                                cualquier momento por un administrador del evento.
                            </div>
                        </div>

                        <div
                            className="modal-actions"
                            style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
                        >
                            <button
                                className="btn btn-ghost"
                                onClick={() => setDeactivatingMember(null)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeactivateConfirm}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                    'Dar de Baja'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

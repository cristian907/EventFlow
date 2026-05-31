import { UserType } from '@eventflow/shared';
import {
    faSearch,
    faUserShield,
    faUserCheck,
    faExclamationTriangle,
    faSpinner,
    faChevronLeft,
    faChevronRight,
    faUserSlash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback } from 'react';

import { api } from '../../../services/axios';
import { useAuth } from '../../auth/context/AuthContext';

export function AdminUsersPage() {
    const { user: currentUser } = useAuth();

    // API States
    const [users, setUsers] = useState<UserType[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal States
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset page to 1 on new search
        }, 300);

        return () => clearTimeout(handler);
    }, [search]);

    // Fetch users list
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }
            if (roleFilter) {
                params.append('role', roleFilter);
            }

            const response = await api.get<{
                users: UserType[];
                total: number;
                totalPages: number;
            }>(`/users?${params.toString()}`);

            setUsers(response.data.users);
            setTotal(response.data.total);
            setTotalPages(response.data.totalPages);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Error al obtener la lista de usuarios.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, roleFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchUsers();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    // Handle Status Change API Call
    const handleStatusChange = () => {
        if (!selectedUser) return;

        setIsUpdating(true);
        setError(null);
        setSuccessMessage(null);

        const newActiveStatus = !selectedUser.isActive;

        api.put(`/users/${selectedUser.id}/active`, { isActive: newActiveStatus })
            .then(() => {
                setSuccessMessage(
                    `El usuario ${selectedUser.fullName} ha sido ${newActiveStatus ? 'activado' : 'desactivado'} con éxito.`,
                );
                setSelectedUser(null);

                // Re-fetch users
                void fetchUsers();

                // Auto hide success message
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 4000);
            })
            .catch((err: unknown) => {
                const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message || 'No se pudo actualizar el estado del usuario.';
                setError(msg);
            })
            .finally(() => {
                setIsUpdating(false);
            });
    };

    return (
        <div>
            {/* Header section */}
            <div
                className="page-header"
                style={{
                    display: 'flex',
                    justifyContent: 'between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h1
                        className="page-title"
                        style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                        Usuarios
                    </h1>
                    <p
                        className="page-subtitle"
                        style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                    >
                        {total} cuentas en total · {users.filter((u) => u.role === 'ADMIN').length}{' '}
                        administradores
                    </p>
                </div>
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
                    }}
                >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Section */}
            <div
                className="card mb-4"
                style={{
                    display: 'flex',
                    gap: 14,
                    padding: 14,
                    marginBottom: 20,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <input
                        className="input"
                        placeholder="Buscar por nombre o correo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '36px' }}
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

                <div style={{ minWidth: '150px' }}>
                    <select
                        className="select"
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">Todos los roles</option>
                        <option value="ADMIN">Administradores</option>
                        <option value="USER">Usuarios</option>
                    </select>
                </div>
            </div>

            {/* Table Wrap */}
            <div className="table-wrap">
                {isLoading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            size="2x"
                            style={{ color: 'var(--primary)', marginBottom: 12 }}
                        />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                            Cargando usuarios del sistema...
                        </p>
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            No se encontraron usuarios coincidentes.
                        </p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Correo</th>
                                <th>Teléfono</th>
                                <th>Rol Global</th>
                                <th>Estado</th>
                                <th>Fecha Registro</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => {
                                const initials = u.fullName
                                    .split(' ')
                                    .map((p) => p[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase();

                                const isSelf = currentUser?.id === u.id;

                                return (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="row" style={{ gap: 10 }}>
                                                <div
                                                    className="avatar"
                                                    style={{
                                                        background:
                                                            u.role === 'ADMIN'
                                                                ? 'var(--primary)'
                                                                : 'var(--secondary)',
                                                    }}
                                                >
                                                    {initials}
                                                </div>
                                                <span
                                                    className="fw-600"
                                                    style={{ fontWeight: 600 }}
                                                >
                                                    {u.fullName} {isSelf && '(Tú)'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-small" style={{ fontSize: 13 }}>
                                            {u.email}
                                        </td>
                                        <td
                                            className="text-small mono"
                                            style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}
                                        >
                                            {u.phoneNumber}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${u.role === 'ADMIN' ? 'primary' : 'secondary'}`}
                                            >
                                                {u.role === 'ADMIN' ? 'ADMINISTRADOR' : 'USUARIO'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge dot ${u.isActive ? 'success' : 'default'}`}
                                            >
                                                {u.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td
                                            className="text-small text-secondary"
                                            style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                                        >
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {u.role === 'ADMIN' ? (
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    disabled
                                                    title="No está permitido desactivar administradores"
                                                    style={{
                                                        opacity: 0.45,
                                                        cursor: 'not-allowed',
                                                    }}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faUserShield}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    Desactivar
                                                </button>
                                            ) : (
                                                <button
                                                    className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`}
                                                    onClick={() => setSelectedUser(u)}
                                                    title={
                                                        u.isActive
                                                            ? `Desactivar cuenta de ${u.fullName}`
                                                            : `Activar cuenta de ${u.fullName}`
                                                    }
                                                    style={
                                                        !u.isActive
                                                            ? {
                                                                  color: 'var(--success)',
                                                                  borderColor: 'var(--success)',
                                                                  background:
                                                                      'var(--success-light)',
                                                              }
                                                            : undefined
                                                    }
                                                >
                                                    <FontAwesomeIcon
                                                        icon={
                                                            u.isActive ? faUserSlash : faUserCheck
                                                        }
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    {u.isActive ? 'Desactivar' : 'Activar'}
                                                </button>
                                            )}
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
                        usuarios)
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

            {/* Confirmation Modal */}
            {selectedUser && (
                <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
                    <div
                        className="modal"
                        style={{ maxWidth: 440 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
                            {selectedUser.isActive ? '¿Desactivar usuario?' : '¿Activar usuario?'}
                        </h3>

                        <p
                            style={{
                                fontSize: 14,
                                color: 'var(--text-secondary)',
                                marginBottom: 18,
                            }}
                        >
                            {selectedUser.isActive ? (
                                <>
                                    Estás a punto de desactivar la cuenta de{' '}
                                    <strong>{selectedUser.fullName}</strong>. El usuario perderá el
                                    acceso al sistema de forma inmediata.
                                </>
                            ) : (
                                <>
                                    Estás a punto de activar la cuenta de{' '}
                                    <strong>{selectedUser.fullName}</strong>. El usuario recuperará
                                    el acceso al sistema de forma inmediata.
                                </>
                            )}
                        </p>

                        <div
                            className="card mt-2 mb-4"
                            style={{
                                background: selectedUser.isActive
                                    ? 'var(--danger-light)'
                                    : 'var(--success-light)',
                                borderColor: 'transparent',
                                padding: 12,
                                borderRadius: 'var(--r-lg)',
                                marginBottom: 20,
                            }}
                        >
                            <div
                                className="text-small fw-600"
                                style={{
                                    color: selectedUser.isActive
                                        ? 'var(--danger)'
                                        : 'var(--success)',
                                    fontWeight: 600,
                                    marginBottom: 4,
                                    fontSize: 12.5,
                                }}
                            >
                                {selectedUser.isActive
                                    ? 'Efecto de desactivación:'
                                    : 'Efecto de activación:'}
                            </div>
                            <div
                                className="text-small"
                                style={{
                                    color: selectedUser.isActive
                                        ? 'var(--danger)'
                                        : 'var(--success)',
                                    fontSize: 12.5,
                                }}
                            >
                                {selectedUser.isActive
                                    ? 'Perderá el acceso al sistema. Sus datos históricos se conservan, pero no podrá iniciar sesión en la plataforma.'
                                    : 'El usuario recuperará el acceso al sistema de forma inmediata y podrá iniciar sesión normalmente con sus credenciales.'}
                            </div>
                        </div>

                        <div
                            className="modal-actions"
                            style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
                        >
                            <button
                                className="btn btn-ghost"
                                onClick={() => setSelectedUser(null)}
                                disabled={isUpdating}
                            >
                                Cancelar
                            </button>
                            <button
                                className={`btn ${selectedUser.isActive ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleStatusChange}
                                disabled={isUpdating}
                                style={
                                    !selectedUser.isActive
                                        ? {
                                              background: 'var(--success)',
                                              color: '#fff',
                                          }
                                        : undefined
                                }
                            >
                                {isUpdating ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                ) : selectedUser.isActive ? (
                                    'Desactivar Usuario'
                                ) : (
                                    'Activar Usuario'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';
import { AuthProvider } from './features/auth/context/AuthContext';
import { LoginPage } from './features/auth/pages/login';
import { NotFoundPage } from './features/errors/pages/not-found';
import { AdminUsersPage } from './features/users/pages/AdminUsersPage';

const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '/', element: <Navigate to="/dashboard" replace /> },
            {
                path: 'dashboard',
                element: (
                    <div className="card elevated" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
                            Dashboard
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            ¡Bienvenido a la administración de EventFlow! Desde el menú lateral
                            podrás gestionar a todos los usuarios del sistema, configurar la
                            plataforma o acceder a las distintas operaciones de venta y control de
                            acceso.
                        </p>
                    </div>
                ),
            },
            { path: 'admin/users', element: <AdminUsersPage /> },
            {
                path: 'events',
                element: (
                    <div className="card elevated" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Eventos</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            El módulo de eventos se encuentra actualmente en desarrollo y estará
                            disponible próximamente en la Issue #8.
                        </p>
                    </div>
                ),
            },
            {
                path: 'comprobantes',
                element: (
                    <div className="card elevated" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
                            Comprobantes
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Cola global de validación de comprobantes de pago (Próximamente).
                        </p>
                    </div>
                ),
            },
            {
                path: 'ventas',
                element: (
                    <div className="card elevated" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
                            Ventas taquilla
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Emisión y venta directa de entradas físicas en taquilla (Próximamente).
                        </p>
                    </div>
                ),
            },
            {
                path: 'verificacion',
                element: (
                    <div className="card elevated" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
                            Verificación en puerta
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Lector y validador de entradas digitales mediante código QR
                            (Próximamente).
                        </p>
                    </div>
                ),
            },
            {
                path: 'config',
                element: (
                    <div className="card elevated" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>
                            Configuración
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Panel de configuración general y ajuste de la tasa cambiaria de
                            referencia de la plataforma.
                        </p>
                    </div>
                ),
            },
        ],
    },
    { path: '*', element: <NotFoundPage /> },
]);

function App(): JSX.Element {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;

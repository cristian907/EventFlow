import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { Layout } from './components/Layout';
import { GeneralConfigPage } from './features/admin-config/pages/GeneralConfigPage';
import { GlobalDashboardPage } from './features/admin-dashboard/pages/GlobalDashboardPage';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { LoginPage } from './features/auth/pages/login';
import { NotFoundPage } from './features/errors/pages/not-found';
import { EventProvider } from './features/events/context/EventContext';
import DoorCheckPage from './features/events/pages/DoorCheckPage';
import { EventConfigPage } from './features/events/pages/EventConfigPage';
import { EventDashboardPage } from './features/events/pages/EventDashboardPage';
import { EventDetailPage } from './features/events/pages/EventDetailPage';
import { EventListPage } from './features/events/pages/EventListPage';
import { EventStaffPage } from './features/events/pages/EventStaffPage';
import SalesPage from './features/events/pages/SalesPage';
import { TicketTypesPage } from './features/events/pages/TicketTypesPage';
import { AdminUsersPage } from './features/users/pages/AdminUsersPage';

function DashboardRoute(): JSX.Element {
    const { user } = useAuth();
    if (user?.role === 'ADMIN') {
        return <GlobalDashboardPage />;
    }
    return (
        <div className="card elevated" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                ¡Bienvenido a la administración de EventFlow! Desde el menú lateral podrás gestionar
                a todos los usuarios del sistema, configurar la plataforma o acceder a las distintas
                operaciones de venta y control de acceso.
            </p>
        </div>
    );
}

const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '/', element: <Navigate to="/dashboard" replace /> },
            {
                path: 'dashboard',
                element: <DashboardRoute />,
            },
            { path: 'admin/users', element: <AdminUsersPage /> },
            {
                path: 'events',
                element: <EventListPage />,
            },
            {
                path: 'events/:eventId',
                element: <EventDetailPage />,
                children: [
                    {
                        path: 'dashboard',
                        element: <EventDashboardPage />,
                    },
                    {
                        path: 'staff',
                        element: <EventStaffPage />,
                    },
                    {
                        path: 'tickets',
                        element: <TicketTypesPage />,
                    },
                    {
                        path: 'sales',
                        element: <SalesPage />,
                    },
                    {
                        path: 'door-check',
                        element: <DoorCheckPage />,
                    },
                    {
                        path: 'config',
                        element: <EventConfigPage />,
                    },
                ],
            },
            {
                path: 'config',
                element: <GeneralConfigPage />,
            },
        ],
    },
    { path: '*', element: <NotFoundPage /> },
]);

function App(): JSX.Element {
    return (
        <AuthProvider>
            <EventProvider>
                <RouterProvider router={router} />
            </EventProvider>
        </AuthProvider>
    );
}

export default App;

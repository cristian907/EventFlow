import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { LoginPage } from './features/auth/pages/login';
import { NotFoundPage } from './features/errors/pages/not-found';

const router = createBrowserRouter([
    { path: '/', element: <Navigate to="/login" replace /> },
    { path: '/login', element: <LoginPage /> },
    { path: '*', element: <NotFoundPage /> },
]);

function App(): JSX.Element {
    return <RouterProvider router={router} />;
}

export default App;

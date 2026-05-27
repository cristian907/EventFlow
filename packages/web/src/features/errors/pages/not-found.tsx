import { useNavigate } from 'react-router-dom';
import '../styles/not-found.css';

export function NotFoundPage(): JSX.Element {
    const navigate = useNavigate();
    const navigateToLogin = async () => await navigate('/login');

    return (
        <main className="not-found">
            <span className="not-found__code">404</span>
            <h1 className="not-found__title">Página no encontrada</h1>
            <p className="not-found__subtitle">
                La página que buscas no existe o fue movida a otra dirección.
            </p>
            <div className="not-found__action">
                <button className="btn btn--primary" onClick={() => void navigateToLogin()}>
                    Volver al inicio
                </button>
            </div>
        </main>
    );
}

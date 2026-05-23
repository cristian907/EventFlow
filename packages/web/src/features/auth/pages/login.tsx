import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { BrandPanel } from '../components/BrandPanel';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

import '../styles/login.css';

export function LoginPage() {
    const { handleLogin, isLoading, error } = useLogin();

    return (
        <div className="login-shell">
            <BrandPanel />

            <section className="form-panel">
                <div className="form-topbar">
                    <a href="#">
                        Soporte
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} size="xs" />
                    </a>
                </div>

                <div className="form-center">
                    <div className="form-card">
                        <div className="org-identity">
                            <div className="org-logo-placeholder">Logo</div>
                            <div className="org-name">Nombre de la Organizaci&oacute;n</div>
                            <div className="org-sub">Panel de administraci&oacute;n</div>
                        </div>

                        <h2 className="form-title">Bienvenido de vuelta</h2>
                        <p className="form-sub">
                            Ingresa tu correo y contrase&ntilde;a para acceder al panel.
                        </p>

                        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
                    </div>
                </div>

                <div className="form-footer">
                    <div className="powered">
                        <span className="copyright">&copy; 2026 Event Flow</span>
                    </div>
                    <a href="#">Soporte</a>
                </div>
            </section>
        </div>
    );
}

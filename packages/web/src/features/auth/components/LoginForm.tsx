import {
    faEnvelope,
    faLock,
    faEye,
    faEyeSlash,
    faCircleExclamation,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import { useLoginForm } from '../hooks/useLoginForm';

export type LoginFormProps = {
    onSubmit: (email: string, password: string) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
};

export function LoginForm({ onSubmit, isLoading = false, error = null }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, errors } = useLoginForm(onSubmit);

    const emailClass = `input input-with-icon${errors.email ? ' input-error' : ''}`;
    const passwordClass = `input input-with-icon${errors.password ? ' input-error' : ''}`;

    return (
        <>
            {error && (
                <div className="error-banner">
                    <FontAwesomeIcon icon={faCircleExclamation} size="sm" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                <div className="field">
                    <label className="field-label" htmlFor="email">
                        Correo electr&oacute;nico
                    </label>
                    <div className="input-group">
                        <span className="leading-icon">
                            <FontAwesomeIcon icon={faEnvelope} />
                        </span>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className={emailClass}
                            placeholder="tu@correo.com"
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>
                    {errors.email && <span className="field-error">{errors.email.message}</span>}
                </div>

                <div className="field">
                    <label className="field-label" htmlFor="password">
                        Contrase&ntilde;a
                    </label>
                    <div className="input-group">
                        <span className="leading-icon">
                            <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            className={passwordClass}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="trailing-btn"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                    </div>
                    {errors.password && (
                        <span className="field-error">{errors.password.message}</span>
                    )}
                </div>

                <div className="form-row">
                    <a href="#" className="forgot">
                        &iquest;Olvidaste tu contrase&ntilde;a?
                    </a>
                </div>

                <button type="submit" className="btn-submit" disabled={isLoading}>
                    {isLoading && <span className="spinner" />}
                    <span>{isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}</span>
                    {!isLoading && <FontAwesomeIcon icon={faArrowRight} size="sm" />}
                </button>
            </form>
        </>
    );
}

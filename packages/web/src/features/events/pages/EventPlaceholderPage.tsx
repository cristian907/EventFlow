import { faCompassDrafting } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface EventPlaceholderPageProps {
    title: string;
}

export function EventPlaceholderPage({ title }: EventPlaceholderPageProps) {
    return (
        <div
            className="card elevated"
            style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                border: '1px solid var(--border)',
            }}
        >
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    marginBottom: 24,
                    fontSize: 32,
                    animation: 'pulse 2s infinite ease-in-out',
                }}
            >
                <FontAwesomeIcon icon={faCompassDrafting} />
            </div>

            <h2
                style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 12,
                    fontFamily: 'var(--font-sans)',
                }}
            >
                Módulo en Construcción: {title}
            </h2>

            <p
                style={{
                    color: 'var(--text-secondary)',
                    fontSize: 15,
                    lineHeight: 1.6,
                    maxWidth: 440,
                    margin: '0 auto 24px',
                    fontFamily: 'var(--font-sans)',
                }}
            >
                Este módulo de evento se encuentra actualmente en desarrollo y estará disponible
                próximamente en las siguientes issues del proyecto.
            </p>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 16px',
                    background: 'var(--bg-base)',
                    borderRadius: 20,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                }}
            >
                <span
                    style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--warning)',
                    }}
                />
                Próximamente disponible
            </div>
        </div>
    );
}

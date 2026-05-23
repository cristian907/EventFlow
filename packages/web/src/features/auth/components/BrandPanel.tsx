export function BrandPanel() {
    return (
        <aside className="brand-panel">
            <div className="brand-top">
                <div className="brand-logo">
                    <img
                        src="../../../../public/logos/logo-app-icon.svg"
                        alt="Event Flow Logo"
                        width={40}
                        height={40}
                    />
                    <div>
                        <div className="name">Event Flow</div>
                        <div className="sub">Gestión de Eventos</div>
                    </div>
                </div>
            </div>

            <div className="brand-mid">
                <h1 className="brand-title">
                    Donde cada <em>evento</em>
                    <br />
                    encuentra su flujo.
                </h1>
                <p className="brand-lede">
                    Gestiona preventas, valida comprobantes y controla la puerta el día del evento
                    &mdash; todo desde una sola plataforma.
                </p>
            </div>

            <div className="brand-foot">
                <span>&copy; 2026 Event Flow</span>
            </div>
        </aside>
    );
}

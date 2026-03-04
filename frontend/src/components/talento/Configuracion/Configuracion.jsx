import { useState } from 'react';
import './Configuracion.css';
import { TabUsuarios } from '..';

const Configuracion = () => {
    const [adminsCount, setAdminsCount] = useState(0);
    // Cachear datos para evitar recargas innecesarias
    const [usuariosData, setUsuariosData] = useState(null);

    return (
        <div className="config-container">
            <div className="page-header-premium">
                <div className="header-titles">
                    <h1 className="page-title">Configuración</h1>
                    <p className="page-subtitle">Gestión de usuarios y accesos</p>
                </div>
                <div className="header-stats">
                    <div className="stat-mini-card">
                        <span className="stat-mini-label">Administradores</span>
                        <span className="stat-mini-value">{adminsCount}</span>
                    </div>
                </div>
            </div>

            <div className="config-content-wrapper">
                <TabUsuarios
                    cachedData={usuariosData}
                    onDataUpdate={setUsuariosData}
                    onAdminsCountUpdate={setAdminsCount}
                />
            </div>
        </div>
    );
};

export default Configuracion;

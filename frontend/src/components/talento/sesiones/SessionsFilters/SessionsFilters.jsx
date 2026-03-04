import React from 'react';
import './SessionsFilters.css';

const SessionsFilters = ({
    filtros,
    handleFiltroChange,
    limpiarFiltros,
    tiposUnicos,
    facilitadoresUnicos,
    responsablesUnicos,
    tiposFormacionUnicas,
    modalidadesUnicas
}) => {
    const hayFiltrosActivos = filtros.busqueda || filtros.fecha || filtros.tipo || filtros.facilitador || filtros.responsable || filtros.tipo_formacion || filtros.modalidad;

    return (
        <div className="filters-container">
            <div className="filters-grid">
                <div className="filter-field">
                    <label className="filter-label">Buscar por nombre</label>
                    <input
                        type="text"
                        value={filtros.busqueda}
                        onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                        className="filter-input"
                        placeholder="Buscar formación..."
                    />
                </div>

                <div className="filter-field">
                    <label className="filter-label">Fecha</label>
                    <input
                        type="date"
                        value={filtros.fecha}
                        onChange={(e) => handleFiltroChange('fecha', e.target.value)}
                        className="filter-input"
                    />
                </div>

                <div className="filter-field">
                    <label className="filter-label">Tipo de actividad</label>
                    <select
                        value={filtros.tipo}
                        onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todos los tipos</option>
                        {tiposUnicos.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Facilitador</label>
                    <select
                        value={filtros.facilitador}
                        onChange={(e) => handleFiltroChange('facilitador', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todos los facilitadores</option>
                        {facilitadoresUnicos.map(facilitador => (
                            <option key={facilitador} value={facilitador}>{facilitador}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Responsable</label>
                    <select
                        value={filtros.responsable}
                        onChange={(e) => handleFiltroChange('responsable', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todos los responsables</option>
                        {responsablesUnicos.map(responsable => (
                            <option key={responsable} value={responsable}>{responsable}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Tipo de formación</label>
                    <select
                        value={filtros.tipo_formacion || ''}
                        onChange={(e) => handleFiltroChange('tipo_formacion', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todas</option>
                        {tiposFormacionUnicas.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label className="filter-label">Modalidad</label>
                    <select
                        value={filtros.modalidad || ''}
                        onChange={(e) => handleFiltroChange('modalidad', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Todas</option>
                        {modalidadesUnicas.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>
                </div>
            </div>

            {hayFiltrosActivos && (
                <button onClick={limpiarFiltros} className="clear-filters-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Limpiar filtros
                </button>
            )}
        </div>
    );
};

export default SessionsFilters;

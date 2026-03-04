import React from 'react';

/**
 * Sección de filtros de búsqueda por nombre y rol para la lista de usuarios.
 */
const UsuariosFiltros = ({
    searchNombre,
    setSearchNombre,
    filterRol,
    setFilterRol,
    hayFiltrosActivos,
    limpiarFiltros,
}) => (
    <div className="filtros-container">
        <div className="filtro-busqueda">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
                className="input-busqueda"
            />
        </div>

        <div className="filtro-rol">
            <label>Filtrar por rol:</label>
            <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)} className="select-filtro-rol">
                <option value="">Todos los roles</option>
                <option value="Usuario">Usuario</option>
                <option value="Administrador">Administrador</option>
            </select>
        </div>

        {hayFiltrosActivos && (
            <button className="btn-limpiar-filtros-minimal" onClick={limpiarFiltros}>
                Limpiar filtros
            </button>
        )}
    </div>
);

export default UsuariosFiltros;

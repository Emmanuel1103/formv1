import React from 'react';

/**
 * Tabla de usuarios con columnas: nombre, rol (editable), formularios creados y acciones.
 */
const UsuariosTabla = ({
    usuariosFiltrados,
    hayFiltrosActivos,
    users,        // total de usuarios sin filtrar (para el contador)
    rolesTemporales,
    changingRol,
    permisos,
    getRoleBadge,
    tieneChangiosPendientes,
    handleCambiarRol,
    handleGuardarRol,
    handleDelete,
}) => (
    <>
        {hayFiltrosActivos && usuariosFiltrados.length > 0 && (
            <div className="resultados-info">
                <span>Mostrando <strong>{usuariosFiltrados.length}</strong> de <strong>{users.length}</strong> usuarios</span>
            </div>
        )}
        <div className="usuarios-table-container">
            <table className="usuarios-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Formularios creados</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {!hayFiltrosActivos ? (
                        <tr>
                            <td colSpan="4" className="empty-table-message">
                                <div className="empty-table-content">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <h3>Busca un usuario</h3>
                                    <p>Usa los filtros de arriba para buscar usuarios por nombre o rol</p>
                                </div>
                            </td>
                        </tr>
                    ) : usuariosFiltrados.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="empty-table-message">
                                <div className="empty-table-content">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <h3>No se encontraron resultados</h3>
                                    <p>Intenta ajustar los filtros para encontrar lo que buscas</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        usuariosFiltrados.map((usuario) => {
                            const roleBadge = getRoleBadge(usuario.rol);
                            const hayCambio = tieneChangiosPendientes(usuario.id);
                            return (
                                <tr key={usuario.id}>
                                    <td>
                                        <div className="usuario-cell">
                                            <div className="usuario-avatar">{usuario.nombre.charAt(0).toUpperCase()}</div>
                                            <div className="usuario-info">
                                                <span className="usuario-nombre">{usuario.nombre}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="rol-select-wrapper">
                                            <select
                                                className={`rol-select ${roleBadge.class}`}
                                                value={rolesTemporales[usuario.id] || usuario.rol}
                                                onChange={(e) => handleCambiarRol(usuario.id, e.target.value)}
                                                disabled={changingRol === usuario.id || !permisos.cambiarRoles}
                                            >
                                                <option value="Usuario">Usuario</option>
                                                <option value="Administrador">Administrador</option>
                                            </select>
                                            <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contador-formularios">
                                            <span className="contador-badge">{usuario.formularios_creados || 0}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {permisos.cambiarRoles ? (
                                                <button
                                                    className={`btn-action btn-save ${hayCambio ? 'has-changes' : ''}`}
                                                    onClick={() => handleGuardarRol(usuario.id, usuario.nombre)}
                                                    disabled={!hayCambio || changingRol === usuario.id}
                                                    title={hayCambio ? 'Guardar cambios' : 'Sin cambios'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#999' }}>Sin permisos</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    </>
);

export default UsuariosTabla;

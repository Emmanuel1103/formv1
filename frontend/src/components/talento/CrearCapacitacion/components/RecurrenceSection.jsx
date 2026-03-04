import React from 'react';
import { formatters } from '../../../../utils/formatters';

const RecurrenceSection = ({
    esRecurrente,
    ocurrenciasProgramadas,
    erroresOcurrencias,
    sesionesExpandidas,
    sesionesConContenido,
    toggleRecurrente,
    agregarOcurrencia,
    eliminarOcurrencia,
    toggleExpandida,
    toggleContenido,
    handleOcurrenciaChange
}) => {
    return (
        <div className="recurrente-toggle-container">
            <div className="recurrente-toggle-header" onClick={toggleRecurrente}>
                <div className="recurrente-toggle-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                    <div>
                        <span className="recurrente-toggle-label">¿Esta actividad cuenta con varias sesiones?</span>
                        <span className="recurrente-toggle-desc">Programa varias fechas para la misma formación</span>
                    </div>
                </div>
                <div className={`toggle-switch ${esRecurrente ? 'active' : ''}`}>
                    <div className="toggle-thumb" />
                </div>
            </div>

            {esRecurrente && (
                <div className="ocurrencias-programadas">
                    <p className="ocurrencias-hint">
                        La fecha inicial ya está definida. Agrega aquí las sesiones adicionales de esta formación.
                        Si la hora o el facilitador no están confirmados, déjalos en blanco.
                    </p>

                    {ocurrenciasProgramadas.length === 0 && (
                        <p className="ocurrencias-empty">No hay sesiones adicionales aún. Haz clic en "Agregar sesión" para añadir.</p>
                    )}

                    {ocurrenciasProgramadas.map((oc, idx) => {
                        const expandida = sesionesExpandidas[oc.id] !== false;
                        const mostrarContenido = sesionesConContenido[oc.id];
                        return (
                            <div key={oc.id} className={`ocurrencia-row ${!expandida ? 'ocurrencia-row--collapsed' : ''}`}>
                                <div className="ocurrencia-row-header" onClick={() => toggleExpandida(oc.id)} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                        <span className="ocurrencia-badge">Sesión {idx + 2}</span>
                                        {!expandida && (
                                            <span className="ocurrencia-resumen">
                                                {oc.fecha ? formatters.fechaCorta(oc.fecha) : 'Sin fecha'}
                                                {oc.hora_inicio ? ` · ${oc.hora_inicio}` : ''}
                                                {oc.facilitador ? ` · ${oc.facilitador}` : ''}
                                                {oc.contenido ? ' · (con contenido)' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="ocurrencia-chevron" style={{ transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#9ca3af', fontSize: 16 }}>▾</span>
                                        <button
                                            type="button"
                                            className="btn-eliminar-ocurrencia"
                                            onClick={(e) => { e.stopPropagation(); eliminarOcurrencia(oc.id); }}
                                            title="Eliminar esta sesión"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {expandida && (
                                    <div className="ocurrencia-fields">
                                        <div className="input-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                                            <label className="input-label">Fecha <span className="required">*</span></label>
                                            <input
                                                type="date"
                                                className={`input ${erroresOcurrencias[oc.id]?.fecha ? 'input-error' : ''}`}
                                                value={oc.fecha}
                                                onChange={e => handleOcurrenciaChange(oc.id, 'fecha', e.target.value)}
                                                required
                                            />
                                            {erroresOcurrencias[oc.id]?.fecha && (
                                                <span className="error-message">{erroresOcurrencias[oc.id].fecha}</span>
                                            )}
                                        </div>
                                        <div className="input-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
                                            <label className="input-label">Hora inicio <span className="optional-label">(opcional)</span></label>
                                            <input
                                                type="time"
                                                className="input"
                                                value={oc.hora_inicio}
                                                onChange={e => handleOcurrenciaChange(oc.id, 'hora_inicio', e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
                                            <label className="input-label">Hora fin <span className="optional-label">(opcional)</span></label>
                                            <input
                                                type="time"
                                                className={`input ${erroresOcurrencias[oc.id]?.hora_fin ? 'input-error' : ''}`}
                                                value={oc.hora_fin}
                                                onChange={e => handleOcurrenciaChange(oc.id, 'hora_fin', e.target.value)}
                                            />
                                            {erroresOcurrencias[oc.id]?.hora_fin && (
                                                <span className="error-message">{erroresOcurrencias[oc.id].hora_fin}</span>
                                            )}
                                        </div>
                                        <div className="input-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                                            <label className="input-label">Facilitador <span className="optional-label">(opcional)</span></label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Ej: Nicolas Ojeda"
                                                value={oc.facilitador}
                                                onChange={e => handleOcurrenciaChange(oc.id, 'facilitador', e.target.value)}
                                            />
                                        </div>
                                        <div className="input-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                            {mostrarContenido ? (
                                                <>
                                                    <label className="input-label">Contenido <span className="optional-label">(específico de esta sesión)</span></label>
                                                    <textarea
                                                        className="input"
                                                        style={{ minHeight: 72, resize: 'vertical', fontFamily: 'inherit', fontSize: 14, paddingTop: 10 }}
                                                        placeholder="Temas o contenido específico de esta sesión..."
                                                        value={oc.contenido}
                                                        onChange={e => handleOcurrenciaChange(oc.id, 'contenido', e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button type="button" className="btn-toggle-contenido" onClick={() => { toggleContenido(oc.id); handleOcurrenciaChange(oc.id, 'contenido', ''); }}>
                                                        Quitar contenido específico
                                                    </button>
                                                </>
                                            ) : (
                                                <button type="button" className="btn-toggle-contenido" onClick={() => toggleContenido(oc.id)}>
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                    Añadir contenido específico
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <button type="button" className="btn-agregar-ocurrencia" onClick={agregarOcurrencia}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Agregar sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecurrenceSection;

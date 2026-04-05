import React from 'react';
import { MESES, DIMENSION_LABELS, DIMENSION_METRICS_MAP } from '../utils/constants';

const PanelLateral = ({
    comparisonMode,
    handleToggleComparison,
    activeSlotId,
    setActiveSlotId,
    slots,
    handleSlotChange,
    handleVisualOptionChange,
    years
}) => {
    return (
        <aside className="intel-control-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: 0 }}>Análisis</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: comparisonMode ? '#26BC58' : '#64748b' }}>Comparativa (vs)</span>
                    <input
                        type="checkbox"
                        checked={comparisonMode}
                        onChange={(e) => handleToggleComparison(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                </div>
            </div>

            {comparisonMode && (
                <div className="slot-selector-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setActiveSlotId(1)}
                        style={{
                            flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: 'none',
                            background: activeSlotId === 1 ? 'white' : 'transparent',
                            color: activeSlotId === 1 ? '#26BC58' : '#64748b',
                            boxShadow: activeSlotId === 1 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Gráfico 1
                    </button>
                    <button
                        onClick={() => setActiveSlotId(2)}
                        style={{
                            flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: 'none',
                            background: activeSlotId === 2 ? 'white' : 'transparent',
                            color: activeSlotId === 2 ? '#26BC58' : '#64748b',
                            boxShadow: activeSlotId === 2 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Gráfico 2
                    </button>
                </div>
            )}

            <div className="control-item-stack">
                {/* El resto de controles usarán el slot activo */}
                {slots.map(slot => slot.id === activeSlotId && (
                    <React.Fragment key={slot.id}>
                        <div className="intel-select-group">
                            <label className="intel-label-label">Dimensión de análisis</label>
                            <select
                                className="intel-select-clean"
                                value={slot.dimension}
                                onChange={(e) => handleSlotChange(slot.id, 'dimension', e.target.value)}
                            >
                                {Object.entries(DIMENSION_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {comparisonMode && (
                            <div className="vs-slot-controls">
                                <div className="intel-select-group" style={{ margin: 0 }}>
                                    <label className="intel-label-mini">Año del análisis</label>
                                    <select
                                        className="vs-select-mini"
                                        value={slot.year}
                                        onChange={(e) => handleSlotChange(slot.id, 'year', e.target.value)}
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="intel-select-group" style={{ margin: 0 }}>
                                    <label className="intel-label-mini">Mes del análisis</label>
                                    <select
                                        className="vs-select-mini"
                                        value={slot.month}
                                        onChange={(e) => handleSlotChange(slot.id, 'month', e.target.value)}
                                    >
                                        <option value="Todos">Todos</option>
                                        {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="intel-select-group">
                            <label className="intel-label-label">Métrica principal</label>
                            <select
                                className="intel-select-clean"
                                value={slot.metric}
                                onChange={(e) => handleSlotChange(slot.id, 'metric', e.target.value)}
                            >
                                {(DIMENSION_METRICS_MAP[slot.dimension] || []).map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="intel-select-group">
                            <label className="intel-label-label">Tipo de actividad</label>
                            <select
                                className="intel-select-clean"
                                value={slot.tipoActividad || 'Todos'}
                                onChange={(e) => handleSlotChange(slot.id, 'tipoActividad', e.target.value)}
                            >
                                <option value="Todos">Internas y externas</option>
                                <option value="Interno">Solo internas</option>
                                <option value="Externo">Solo externas</option>
                            </select>
                        </div>

                        <div className="intel-select-group">
                            <label className="intel-label-label">Visualización</label>
                            <select
                                className="intel-select-clean"
                                value={slot.type}
                                onChange={(e) => handleSlotChange(slot.id, 'type', e.target.value)}
                            >
                                <option value="bar-vertical">Gráfico de barras</option>
                                <option value="line">Gráfico de líneas</option>
                                <option value="bar-horizontal">Ranking comparativo</option>
                                <option value="radar">Gráfico de radar</option>
                                <option value="pie">Distribución circular</option>
                                <option value="area">Tendencia de área</option>
                            </select>
                        </div>

                        {slot.dimension === 'mes' && (
                            <div className="intel-select-group">
                                <label className="intel-label-label">Agrupación temporal</label>
                                <select
                                    className="intel-select-clean"
                                    value={slot.grouping}
                                    onChange={(e) => handleSlotChange(slot.id, 'grouping', e.target.value)}
                                >
                                    <option value="month">Vista mensual</option>
                                    <option value="year">Vista anual</option>
                                </select>
                            </div>
                        )}

                        {/* Opciones contextuales */}
                        {slot.type === 'radar' && (
                            <div className="radar-advanced-options" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '15px' }}>Radar: {DIMENSION_LABELS[slot.dimension].toLowerCase()}</h4>
                                <div className="intel-select-group" style={{ marginBottom: '15px' }}>
                                    <label className="intel-label-label">Estilo de rejilla</label>
                                    <select
                                        className="intel-select-clean"
                                        value={slot.visualOptions.gridType}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'gridType', e.target.value)}
                                    >
                                        <option value="polygon">Polígono (mallas)</option>
                                        <option value="circle">Circular (web)</option>
                                    </select>
                                </div>
                                <div className="intel-select-group" style={{ marginBottom: '15px' }}>
                                    <label className="intel-label-label">Opacidad</label>
                                    <input
                                        type="range" min="0.1" max="0.9" step="0.1"
                                        value={slot.visualOptions.fillOpacity}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'fillOpacity', parseFloat(e.target.value))}
                                        className="intel-range-slider"
                                    />
                                </div>
                            </div>
                        )}

                        {(slot.type === 'bar-vertical' || slot.type === 'bar-horizontal') && (
                            <div className="radar-advanced-options" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '15px' }}>Barras</h4>
                                <div className="intel-select-group" style={{ marginBottom: '15px' }}>
                                    <label className="intel-label-label">Grosor de barra</label>
                                    <input
                                        type="range" min="10" max="60" step="5"
                                        value={slot.visualOptions.barSize}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'barSize', parseInt(e.target.value))}
                                        className="intel-range-slider"
                                    />
                                </div>
                                <div className="intel-select-group">
                                    <label className="intel-label-label">Redondeado (px)</label>
                                    <input
                                        type="range" min="0" max="20" step="2"
                                        value={slot.visualOptions.borderRadius}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'borderRadius', parseInt(e.target.value))}
                                        className="intel-range-slider"
                                    />
                                </div>
                            </div>
                        )}

                        {slot.type === 'pie' && (
                            <div className="radar-advanced-options" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '15px' }}>Diseño circular</h4>
                                <div className="intel-select-group" style={{ marginBottom: '15px' }}>
                                    <label className="intel-label-label">Anillo interno (%)</label>
                                    <input
                                        type="range" min="0" max="80" step="10"
                                        value={slot.visualOptions.innerRadius}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'innerRadius', parseInt(e.target.value))}
                                        className="intel-range-slider"
                                    />
                                </div>
                                <div className="intel-select-group">
                                    <label className="intel-label-label">Separación (deg)</label>
                                    <input
                                        type="range" min="0" max="10" step="1"
                                        value={slot.visualOptions.paddingAngle}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'paddingAngle', parseInt(e.target.value))}
                                        className="intel-range-slider"
                                    />
                                </div>
                            </div>
                        )}

                        {slot.type === 'area' && (
                            <div className="radar-advanced-options" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                                <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '15px' }}>Personalización de área</h4>
                                <div className="intel-select-group">
                                    <label className="intel-label-label">Opacidad de fondo</label>
                                    <input
                                        type="range" min="0.1" max="0.6" step="0.1"
                                        value={slot.visualOptions.areaOpacity}
                                        onChange={(e) => handleVisualOptionChange(slot.id, 'areaOpacity', parseFloat(e.target.value))}
                                        className="intel-range-slider"
                                    />
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </aside>
    );
};

export default PanelLateral;

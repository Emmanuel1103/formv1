import React from 'react';
import GraficoBase from './GraficoBase';
import { DIMENSION_LABELS, METRIC_LABELS } from '../utils/constants';
import { Iconos } from './Iconos';

const CuadriculaGraficos = ({ comparisonMode, slots, slotChartData, handleExportExcel, handleExportJPG }) => {
    return (
        <main className="intel-visual-content">
            <div style={{ display: 'grid', gridTemplateColumns: comparisonMode ? '1fr 1fr' : '1fr', gap: '30px', height: '100%' }}>
                {slots.map(slot => (
                    <div key={slot.id} className="chart-slot-container" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="visual-title-box" style={{ marginBottom: '20px', padding: '0 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: comparisonMode ? '16px' : '22px' }}>{`${METRIC_LABELS[slot.metric]} por ${DIMENSION_LABELS[slot.dimension].toLowerCase()}`}</h2>
                                    {!comparisonMode && <p>Análisis detallado de <strong>{METRIC_LABELS[slot.metric].toLowerCase()}</strong> distribuidos por <strong>{DIMENSION_LABELS[slot.dimension].toLowerCase()}</strong></p>}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleExportExcel(slot)}
                                        className="btn-export-intel"
                                        title="Exportar a excel"
                                        style={{ color: '#16a34a' }}
                                    >
                                        <Iconos.Excel />
                                    </button>
                                    <button
                                        onClick={() => handleExportJPG(`chart-${slot.id}`, slot)}
                                        className="btn-export-intel"
                                        title="Capturar imagen"
                                        style={{ color: '#16a34a' }}
                                    >
                                        <Iconos.Image />
                                    </button>
                                </div>
                            </div>
                            {comparisonMode && (
                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        color: '#1e293b',
                                        background: '#f1f5f9',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <Iconos.Filter />
                                        {slot.year} · {slot.month}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div id={`chart-${slot.id}`} className="hero-chart-surface" style={{ flex: 1, minHeight: '520px' }}>
                            <GraficoBase
                                type={slot.type}
                                data={slotChartData[slot.id]}
                                dataKey="valor"
                                title={slot.title}
                                color={slot.color}
                                visualOptions={slot.visualOptions}
                                xAxisLabel={DIMENSION_LABELS[slot.dimension]}
                                yAxisLabel={METRIC_LABELS[slot.metric]}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default CuadriculaGraficos;

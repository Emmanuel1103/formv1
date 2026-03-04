import React from 'react';
import { Loading, Toast } from '../../common';
import { useVerAsistentes } from './hooks/useVerAsistentes';
import AsistentesFiltros from './components/AsistentesFiltros';
import AsistentesTabla from './components/AsistentesTabla';
import './VerAsistentes.css';

const VerAsistentes = () => {
  const {
    sesiones, sesionSeleccionada, ocurrenciaSeleccionada, setOcurrenciaSeleccionada,
    asistentes, loading, loadingAsistentes, toast, setToast,
    sesionActual, fechaMostrada, horaMostrada, facilitadorMostrado, totalSesiones,
    handleSeleccionarSesion, exportarXLSX, exportarConsolidadoXLSX
  } = useVerAsistentes();

  if (loading) return <Loading />;

  return (
    <div className="ver-asistentes">
      <div className="page-header">
        <h1 className="page-title">Ver asistentes</h1>
        <p className="page-subtitle">Consulta los participantes registrados en cada formación</p>
      </div>

      <AsistentesFiltros
        sesiones={sesiones}
        sesionSeleccionada={sesionSeleccionada}
        sesionActual={sesionActual}
        ocurrenciaSeleccionada={ocurrenciaSeleccionada}
        setOcurrenciaSeleccionada={setOcurrenciaSeleccionada}
        fechaMostrada={fechaMostrada}
        horaMostrada={horaMostrada}
        facilitadorMostrado={facilitadorMostrado}
        totalSesiones={totalSesiones}
        asistentes={asistentes}
        handleSeleccionarSesion={handleSeleccionarSesion}
        exportarXLSX={exportarXLSX}
        exportarConsolidadoXLSX={exportarConsolidadoXLSX}
      />

      {loadingAsistentes ? (
        <Loading />
      ) : asistentes.length === 0 && sesionSeleccionada ? (
        <div className="empty-asistentes">
          <p>Aún no hay asistentes registrados para esta formación en la fecha seleccionada.</p>
        </div>
      ) : asistentes.length > 0 ? (
        <AsistentesTabla
          asistentes={asistentes}
          tipoFormacion={sesionActual?.tipo_formacion}
        />
      ) : (
        <div className="empty-asistentes">
          <p>Selecciona una formación para ver el listado de asistentes.</p>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

export default VerAsistentes;

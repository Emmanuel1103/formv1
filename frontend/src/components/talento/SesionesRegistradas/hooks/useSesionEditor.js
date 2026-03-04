import { useState } from 'react';
import { sesionesService } from '../../../../services/sesiones';

export const useSesionEditor = (setSesiones, setToast) => {
    const [modalDetalles, setModalDetalles] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({});
    const [erroresEdicion, setErroresEdicion] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [customTipoEdicion, setCustomTipoEdicion] = useState('');
    const [sesionTabActiva, setSesionTabActiva] = useState('__principal__');

    // Estado para agregar nuevas ocurrencias desde el modal de detalles
    const [mostrarFormOcurrencia, setMostrarFormOcurrencia] = useState(false);
    const [nuevaOcurrencia, setNuevaOcurrencia] = useState({
        fecha: '', hora_inicio: '', hora_fin: '', facilitador: '', contenido: ''
    });
    const [mostrarContenidoNuevaOc, setMostrarContenidoNuevaOc] = useState(false);
    const [guardandoOcurrencia, setGuardandoOcurrencia] = useState(false);

    const handleEditar = () => {
        const tabActualData = sesionTabActiva === '__principal__'
            ? modalDetalles
            : (modalDetalles.ocurrencias || []).find(oc => oc.id === sesionTabActiva) || {};

        setDatosEdicion({
            tema: tabActualData.tema || modalDetalles.tema || '',
            fecha: tabActualData.fecha || '',
            hora_inicio: tabActualData.hora_inicio || '',
            hora_fin: tabActualData.hora_fin || '',
            facilitador: tabActualData.facilitador || modalDetalles.facilitador || '',
            tipo_actividad: tabActualData.tipo_actividad || modalDetalles.tipo_actividad || '',
            tipo_formacion: tabActualData.tipo_formacion || modalDetalles.tipo_formacion || '',
            modalidad: tabActualData.modalidad || modalDetalles.modalidad || '',
            responsable: tabActualData.responsable || modalDetalles.responsable || '',
            cargo: tabActualData.cargo || modalDetalles.cargo || '',
            contenido: tabActualData.contenido || modalDetalles.contenido || ''
        });
        setModoEdicion(true);
    };

    const handleCancelarEdicion = () => {
        setModoEdicion(false);
        setDatosEdicion({});
        setErroresEdicion({});
        setCustomTipoEdicion('');
    };

    const handleCambioEdicion = (campo, valor) => {
        if (campo === 'custom_tipo') {
            setCustomTipoEdicion(valor);
            if (erroresEdicion.custom_tipo) {
                setErroresEdicion(prev => ({ ...prev, custom_tipo: null }));
            }
            return;
        }
        if (campo === 'tipo_actividad' && !valor.startsWith('Otros')) {
            setCustomTipoEdicion('');
            setErroresEdicion(prev => ({ ...prev, custom_tipo: undefined }));
        }
        setDatosEdicion(prev => ({ ...prev, [campo]: valor }));
        if (erroresEdicion[campo]) {
            setErroresEdicion(prev => ({ ...prev, [campo]: null }));
        }
    };

    const validarEdicion = () => {
        const errores = {};
        const esPrincipal = sesionTabActiva === '__principal__';
        if (esPrincipal) {
            if (!datosEdicion.hora_inicio) errores.hora_inicio = 'Hora inicio es obligatoria';
            if (!datosEdicion.hora_fin) errores.hora_fin = 'Hora fin es obligatoria';
            if (!datosEdicion.tipo_actividad) errores.tipo_actividad = 'Selecciona un tipo';
            if (datosEdicion.tipo_actividad?.startsWith('Otros') && !customTipoEdicion?.trim()) {
                errores.custom_tipo = 'Especifica el tipo';
            }
            if (!datosEdicion.contenido?.trim()) errores.contenido = 'El contenido es obligatorio';
            if (!datosEdicion.facilitador?.trim()) errores.facilitador = 'El facilitador es obligatorio';
            if (!datosEdicion.tipo_formacion) errores.tipo_formacion = 'Selecciona un tipo de formación';
            if (!datosEdicion.modalidad) errores.modalidad = 'Selecciona una modalidad';
            if (!datosEdicion.responsable?.trim()) errores.responsable = 'El responsable es obligatorio';
            if (!datosEdicion.cargo?.trim()) errores.cargo = 'El cargo es obligatorio';
        }
        if (!datosEdicion.fecha) errores.fecha = 'La fecha es obligatoria';
        setErroresEdicion(errores);
        return Object.keys(errores).length === 0;
    };

    const handleGuardarEdicion = async () => {
        if (!validarEdicion()) return;
        setGuardando(true);
        try {
            const datosParaGuardar = {
                ...datosEdicion,
                tipo_actividad: datosEdicion.tipo_actividad?.startsWith('Otros') ? customTipoEdicion : datosEdicion.tipo_actividad,
            };

            if (sesionTabActiva !== '__principal__') {
                Object.keys(datosParaGuardar).forEach(key => {
                    if (datosParaGuardar[key] === '' || datosParaGuardar[key] === null) {
                        datosParaGuardar[key] = null;
                    }
                });
            }

            if (sesionTabActiva === '__principal__') {
                await sesionesService.actualizar(modalDetalles.id, datosParaGuardar);
                const sesionActualizada = { ...modalDetalles, ...datosParaGuardar };
                setModalDetalles(sesionActualizada);
                setSesiones(prev => prev.map(s => s.id === modalDetalles.id ? { ...s, ...datosParaGuardar } : s));
            } else {
                await sesionesService.actualizarOcurrencia(modalDetalles.id, sesionTabActiva, datosParaGuardar);
                const nuevasOcurrencias = (modalDetalles.ocurrencias || []).map(oc =>
                    oc.id === sesionTabActiva ? { ...oc, ...datosParaGuardar } : oc
                );
                const sesionActualizada = { ...modalDetalles, ocurrencias: nuevasOcurrencias };
                setModalDetalles(sesionActualizada);
                setSesiones(prev => prev.map(s => s.id === modalDetalles.id ? { ...s, ocurrencias: nuevasOcurrencias } : s));
            }
            setModoEdicion(false);
            setDatosEdicion({});
            setErroresEdicion({});
            setCustomTipoEdicion('');
            setToast({ message: 'Cambios guardados exitosamente', type: 'success' });
        } catch (error) {
            console.error('Error al guardar:', error);
            setToast({ message: 'Error al guardar los cambios', type: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    const cerrarModal = () => {
        setModalDetalles(null);
        setModoEdicion(false);
        setSesionTabActiva('__principal__');
        setMostrarFormOcurrencia(false);
    };

    return {
        modalDetalles,
        setModalDetalles,
        modoEdicion,
        setModoEdicion,
        datosEdicion,
        setDatosEdicion,
        erroresEdicion,
        setErroresEdicion,
        guardando,
        customTipoEdicion,
        setCustomTipoEdicion,
        sesionTabActiva,
        setSesionTabActiva,
        mostrarFormOcurrencia,
        setMostrarFormOcurrencia,
        nuevaOcurrencia,
        setNuevaOcurrencia,
        mostrarContenidoNuevaOc,
        setMostrarContenidoNuevaOc,
        guardandoOcurrencia,
        setGuardandoOcurrencia,
        handleEditar,
        handleCancelarEdicion,
        handleCambioEdicion,
        handleGuardarEdicion,
        cerrarModal
    };
};

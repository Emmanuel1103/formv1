import { useState, useEffect, useMemo } from 'react';
import { sesionesService, hayCacheValida } from '../../../../services/sesiones';

export const useSesionesData = (esAdministrador, userEmail, setToast) => {
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(!hayCacheValida());
    const [verGlobal, setVerGlobal] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [filtros, setFiltros] = useState({
        busqueda: '',
        fecha: '',
        tipo: '',
        facilitador: '',
        responsable: '',
        tipo_formacion: '',
        modalidad: ''
    });

    useEffect(() => {
        loadSesiones();
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handleTabletChange = (e) => {
            if (e.matches) setViewMode('cards');
        };
        mediaQuery.addEventListener('change', handleTabletChange);
        handleTabletChange(mediaQuery);
        return () => mediaQuery.removeEventListener('change', handleTabletChange);
    }, []);

    const loadSesiones = async () => {
        try {
            const data = await sesionesService.listar();
            setSesiones(data);
        } catch (error) {
            console.error('Error cargando sesiones:', error);
            setToast({ message: 'Error al cargar las formaciones', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '', fecha: '', tipo: '', facilitador: '',
            responsable: '', tipo_formacion: '', modalidad: ''
        });
        setCurrentPage(1);
    };

    const sesionesAgrupadas = useMemo(() => {
        const sesionesAMapear = (esAdministrador && !verGlobal)
            ? sesiones.filter(s => s.created_by === userEmail)
            : sesiones;

        return sesionesAMapear.map(s => {
            let total_asistentes = s.total_asistentes_principal || 0;
            let tiene_ocurrencias = false;
            let total_fechas = 1;

            if (s.ocurrencias && s.ocurrencias.length > 0) {
                tiene_ocurrencias = true;
                total_fechas += s.ocurrencias.length;
                s.ocurrencias.forEach(oc => {
                    total_asistentes += (oc.total_asistentes || 0);
                });
            }

            return {
                ...s,
                uid: s.id,
                tiene_ocurrencias,
                total_fechas,
                total_asistentes_view: total_asistentes
            };
        });
    }, [sesiones, esAdministrador, verGlobal, userEmail]);

    const sesionesFiltradas = sesionesAgrupadas.filter(sesion => {
        const cumpleBusqueda = !filtros.busqueda || sesion.tema?.toLowerCase().includes(filtros.busqueda.toLowerCase());
        const cumpleFecha = !filtros.fecha || sesion.fecha === filtros.fecha;
        const cumpleTipo = !filtros.tipo || sesion.tipo_actividad === filtros.tipo;
        const cumpleFacilitador = !filtros.facilitador || sesion.facilitador === filtros.facilitador;
        const cumpleResponsable = !filtros.responsable || sesion.responsable === filtros.responsable;
        const cumpleTipoFormacion = !filtros.tipo_formacion || sesion.tipo_formacion === filtros.tipo_formacion;
        const cumpleModalidad = !filtros.modalidad || sesion.modalidad === filtros.modalidad;
        return cumpleBusqueda && cumpleFecha && cumpleTipo && cumpleFacilitador && cumpleResponsable && cumpleTipoFormacion && cumpleModalidad;
    });

    const totalPages = Math.ceil(sesionesFiltradas.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentSesiones = sesionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);

    // Opciones únicas para filtros
    const uniqueOptions = useMemo(() => ({
        tipos: [...new Set(sesionesAgrupadas.map(s => s.tipo_actividad).filter(Boolean))],
        facilitadores: [...new Set(sesionesAgrupadas.map(s => s.facilitador).filter(Boolean))],
        responsables: [...new Set(sesionesAgrupadas.map(s => s.responsable).filter(Boolean))],
        tiposFormacion: [...new Set(sesionesAgrupadas.map(s => s.tipo_formacion).filter(Boolean))],
        modalidades: [...new Set(sesionesAgrupadas.map(s => s.modalidad).filter(Boolean))]
    }), [sesionesAgrupadas]);

    return {
        sesiones,
        setSesiones,
        loading,
        verGlobal,
        setVerGlobal,
        viewMode,
        setViewMode,
        currentPage,
        setCurrentPage,
        filtros,
        handleFiltroChange,
        limpiarFiltros,
        sesionesFiltradas,
        currentSesiones,
        totalPages,
        indexOfFirstItem,
        indexOfLastItem,
        uniqueOptions,
        loadSesiones
    };
};

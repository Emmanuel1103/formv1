import { useState, useEffect } from 'react';
import { usuariosService } from '../../../../services/usuarios';
import { tienePermiso } from '../../../../utils/permisos';

/**
 * Hook que centraliza toda la lógica de negocio de TabUsuarios:
 * - Carga de permisos y usuarios
 * - Gestión de roles temporales
 * - Acciones (guardar, eliminar, refresh)
 * - Filtros de búsqueda
 */
export const useTabUsuarios = ({ cachedData, onDataUpdate }) => {
    const [usuarios, setUsuarios] = useState(cachedData || []);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [changingRol, setChangingRol] = useState(null);
    const [rolesTemporales, setRolesTemporales] = useState({});
    const [searchNombre, setSearchNombre] = useState('');
    const [filterRol, setFilterRol] = useState('');
    const [permisos, setPermisos] = useState({ ver: false, cambiarRoles: false, eliminar: false });
    const [verificandoPermisos, setVerificandoPermisos] = useState(true);

    // ── Permisos ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const cargarPermisos = async () => {
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );
                const permisosPromise = Promise.all([
                    tienePermiso('ver_usuarios'),
                    tienePermiso('cambiar_roles'),
                    tienePermiso('eliminar_usuarios')
                ]);
                const [ver, cambiarRoles, eliminar] = await Promise.race([permisosPromise, timeoutPromise]);
                setPermisos({ ver, cambiarRoles, eliminar });
            } catch {
                setPermisos({ ver: false, cambiarRoles: false, eliminar: false });
            } finally {
                setVerificandoPermisos(false);
            }
        };
        cargarPermisos();
    }, []);

    // ── Carga inicial de usuarios ─────────────────────────────────────────────
    useEffect(() => {
        if (!cachedData) {
            cargarUsuarios();
        } else {
            setUltimaActualizacion(new Date());
        }
    }, []); // eslint-disable-line

    // ── Helpers internos ──────────────────────────────────────────────────────
    const showToast = (message, type = 'success') =>
        setToast({ show: true, message, type });

    const _inicializarRolesTemporales = (data) => {
        const mapa = {};
        data.forEach(u => { mapa[u.id] = u.rol; });
        setRolesTemporales(mapa);
    };

    // ── Acciones ──────────────────────────────────────────────────────────────
    const cargarUsuarios = async () => {
        try {
            setLoading(true);
            const data = await usuariosService.listar();
            setUsuarios(data);
            onDataUpdate?.(data);
            _inicializarRolesTemporales(data);
            setUltimaActualizacion(new Date());
        } catch {
            showToast('Error al cargar usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            const data = await usuariosService.listar();
            setUsuarios(data);
            onDataUpdate?.(data);
            _inicializarRolesTemporales(data);
            setUltimaActualizacion(new Date());
            showToast('Datos actualizados correctamente', 'success');
        } catch {
            showToast('Error al actualizar los datos', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    const handleCambiarRol = (usuarioId, nuevoRol) =>
        setRolesTemporales(prev => ({ ...prev, [usuarioId]: nuevoRol }));

    const handleGuardarRol = async (usuarioId, nombreUsuario) => {
        const nuevoRol = rolesTemporales[usuarioId];
        const usuario = usuarios.find(u => u.id === usuarioId);
        if (nuevoRol === usuario.rol) {
            showToast('No hay cambios para guardar', 'info');
            return;
        }
        try {
            setChangingRol(usuarioId);
            await usuariosService.cambiarRol(usuarioId, nuevoRol);
            showToast(`Rol de ${nombreUsuario} actualizado a ${nuevoRol}`, 'success');
            await cargarUsuarios();
        } catch (error) {
            showToast(error.message || 'Error al cambiar rol', 'error');
            setRolesTemporales(prev => ({ ...prev, [usuarioId]: usuario.rol }));
        } finally {
            setChangingRol(null);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                await usuariosService.eliminar(userId);
                showToast('Usuario eliminado exitosamente', 'success');
                await cargarUsuarios();
            } catch (error) {
                showToast(error.message || 'Error al eliminar usuario', 'error');
            }
        }
    };

    const tieneChangiosPendientes = (usuarioId) => {
        const usuario = usuarios.find(u => u.id === usuarioId);
        return usuario && rolesTemporales[usuarioId] !== usuario.rol;
    };

    // ── Filtros ───────────────────────────────────────────────────────────────
    const usuariosFiltrados = usuarios.filter(u => {
        const matchNombre = u.nombre.toLowerCase().includes(searchNombre.toLowerCase());
        const matchRol = filterRol === '' || u.rol === filterRol;
        return matchNombre && matchRol;
    });

    const hayFiltrosActivos = searchNombre !== '' || filterRol !== '';

    const limpiarFiltros = () => { setSearchNombre(''); setFilterRol(''); };

    // ── Utilidades ────────────────────────────────────────────────────────────
    const formatearHoraActualizacion = (fecha) => {
        try {
            return new Date(fecha).toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Bogota'
            });
        } catch { return ''; }
    };

    const getRoleBadge = (rol) => {
        const roles = {
            'Administrador': { class: 'badge-admin', icon: '👑' },
            'Usuario': { class: 'badge-user', icon: '👤' }
        };
        return roles[rol] || roles['Usuario'];
    };

    return {
        // Estado
        usuarios, loading, refreshing, ultimaActualizacion, toast, setToast,
        changingRol, permisos, verificandoPermisos,
        // Filtros
        searchNombre, setSearchNombre, filterRol, setFilterRol,
        usuariosFiltrados, hayFiltrosActivos, limpiarFiltros,
        rolesTemporales,
        // Acciones
        handleRefresh, handleCambiarRol, handleGuardarRol, handleDelete,
        tieneChangiosPendientes,
        // Utilidades
        formatearHoraActualizacion, getRoleBadge,
    };
};

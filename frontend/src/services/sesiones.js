import api from './api';

// Caché stale-while-revalidate para la lista de sesiones
let _sesionesCache = null;
let _cacheTimestamp = null;
let _pendingRequest = null; // Deduplicación: evita múltiples peticiones simultáneas
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

const invalidarCache = () => {
  _sesionesCache = null;
  _cacheTimestamp = null;
  _pendingRequest = null;
};

export const hayCacheValida = () => cacheEsValido();

const cacheEsValido = () =>
  _sesionesCache !== null && Date.now() - _cacheTimestamp < CACHE_TTL;

export const sesionesService = {
  // Crear nueva capacitación
  crear: async (sesionData) => {
    const response = await api.post('/api/sesiones', sesionData);
    invalidarCache();
    return response.data;
  },

  // Listar todas las capacitaciones (con caché SWR + deduplicación)
  listar: async () => {
    // 1. Caché válida: devolver inmediatamente y refrescar en background
    if (cacheEsValido()) {
      api.get('/api/sesiones').then(r => {
        _sesionesCache = r.data;
        _cacheTimestamp = Date.now();
      }).catch(() => { });
      return _sesionesCache;
    }

    // 2. Ya hay una petición en vuelo: esperar la misma (no lanzar otra)
    if (_pendingRequest) {
      return _pendingRequest;
    }

    // 3. Sin caché y sin petición activa: lanzar una nueva
    _pendingRequest = api.get('/api/sesiones')
      .then(r => {
        _sesionesCache = r.data;
        _cacheTimestamp = Date.now();
        return r.data;
      })
      .finally(() => {
        _pendingRequest = null;
      });

    return _pendingRequest;
  },

  // Obtener una capacitación por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/api/sesiones/${id}`);
    return response.data;
  },

  // Actualizar capacitación
  actualizar: async (id, sesionData) => {
    const response = await api.put(`/api/sesiones/${id}`, sesionData);
    invalidarCache();
    return response.data;
  },

  // Eliminar capacitación
  eliminar: async (id) => {
    await api.delete(`/api/sesiones/${id}`);
    invalidarCache();
  },

  // Obtener asistentes de una capacitación (con filtro opcional por ocurrencia)
  obtenerAsistentes: async (id, ocurrenciaId = null) => {
    const params = ocurrenciaId ? `?ocurrencia_id=${ocurrenciaId}` : '';
    const response = await api.get(`/api/sesiones/${id}/asistentes${params}`);
    return response.data;
  },

  // Añadir una nueva ocurrencia/fecha a una formación
  agregarOcurrencia: async (sesionId, datos) => {
    const response = await api.post(`/api/sesiones/${sesionId}/ocurrencias`, datos);
    invalidarCache();
    return response.data;
  },

  // Eliminar una ocurrencia de una formación
  eliminarOcurrencia: async (sesionId, ocurrenciaId) => {
    await api.delete(`/api/sesiones/${sesionId}/ocurrencias/${ocurrenciaId}`);
    invalidarCache();
  },

  // Actualizar una ocurrencia de una formación
  actualizarOcurrencia: async (sesionId, ocurrenciaId, datos) => {
    const response = await api.patch(`/api/sesiones/${sesionId}/ocurrencias/${ocurrenciaId}`, datos);
    invalidarCache();
    return response.data;
  },

  // Obtener reporte completo consolidado
  obtenerReporteCompleto: async () => {
    const response = await api.get('/api/seguimiento/reporte-completo');
    return response.data;
  }
};

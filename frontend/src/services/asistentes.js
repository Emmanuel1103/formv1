import { publicApi } from './api';

export const asistentesService = {
  // Obtener información pública de sesión por token
  obtenerSesionPorToken: async (token) => {
    const response = await publicApi.get(`/api/sesion/${token}/`);
    return response.data;
  },

  // Registrar asistencia interna
  registrarInterno: async (asistenteData) => {
    const response = await publicApi.post('/api/asistencia/interna/', asistenteData);
    return response.data;
  },

  // Registrar asistencia externa
  registrarExterno: async (asistenteData) => {
    const response = await publicApi.post('/api/asistencia/externa/', asistenteData);
    return response.data;
  },

  // Buscar asistente por cédula
  buscarPorCedula: async (cedula) => {
    const response = await publicApi.get(`/api/asistentes/${cedula}/`);
    return response.data;
  },

  // Actualizar datos de un asistente
  actualizarAsistente: async (cedula, asistenteData) => {
    const response = await publicApi.patch(`/api/asistentes/${cedula}/`, asistenteData);
    return response.data;
  }
};

import api from './api';

export const seguimientoService = {
    // Obtener resumen de todos los participantes
    listarParticipantes: async (userEmail = null) => {
        const url = userEmail ? `/api/seguimiento/participantes?user_email=${encodeURIComponent(userEmail)}` : '/api/seguimiento/participantes';
        const response = await api.get(url);
        return response.data;
    },

    // Obtener detalle e historial de un participante por cédula
    obtenerDetalle: async (cedula, userEmail = null) => {
        const url = userEmail ? `/api/seguimiento/participantes/${cedula}?user_email=${encodeURIComponent(userEmail)}` : `/api/seguimiento/participantes/${cedula}`;
        const response = await api.get(url);
        return response.data;
    }
};

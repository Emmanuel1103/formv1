import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { asistentesService } from '../../services/asistentes';
import RegistroInterno from './internas/RegistroInterno';
import RegistroExterno from './externas/RegistroExterno';
import { Loading } from '../../components/common';

const RegistroMain = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [errorInfo, setErrorInfo] = useState(null);
    const [sesion, setSesion] = useState(null);

    useEffect(() => {
        const fetchSesionInfo = async () => {
            if (!token) {
                setErrorInfo({ title: 'Enlace Inválido', message: 'No se proporcionó un token de capacitación.' });
                setLoading(false);
                return;
            }

            try {
                const info = await asistentesService.obtenerSesionPorToken(token);
                setSesion(info);
            } catch (err) {
                const status = err.response?.status;
                const detail = err.response?.data?.detail || 'Error al cargar la información';

                if (status === 404) {
                    setErrorInfo({ title: 'Capacitación no encontrada', message: detail });
                } else if (status === 400 || status === 403) {
                    setErrorInfo({ title: 'Enlace expirado o inactivo', message: detail });
                } else {
                    setErrorInfo({ title: 'Error del servidor', message: 'Por favor, intenta nuevamente más tarde.' });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSesionInfo();
    }, [token]);

    if (loading) {
        return <Loading text="Verificando información de la sesión..." />;
    }

    if (errorInfo) {
        return (
            <div className="registro-container">
                <div className="registro-card error-card">
                    <div className="error-icon">❌</div>
                    <h2>{errorInfo.title}</h2>
                    <p>{errorInfo.message}</p>
                </div>
            </div>
        );
    }

    // Renderizar el formulario correspondiente según el tipo de formación
    if (sesion?.tipo_formacion === 'Externa') {
        return <RegistroExterno sesion={sesion} token={token} />;
    }

    // Por defecto (y para formaciones internas)
    return <RegistroInterno sesion={sesion} token={token} />;
};

export default RegistroMain;

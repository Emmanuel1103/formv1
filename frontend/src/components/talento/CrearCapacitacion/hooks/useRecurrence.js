import { useState } from 'react';

export const useRecurrence = () => {
    const [esRecurrente, setEsRecurrente] = useState(false);
    const [ocurrenciasProgramadas, setOcurrenciasProgramadas] = useState([]);
    const [erroresOcurrencias, setErroresOcurrencias] = useState({});
    const [sesionesExpandidas, setSesionesExpandidas] = useState({});
    const [sesionesConContenido, setSesionesConContenido] = useState({});

    const toggleExpandida = (id) => setSesionesExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleContenido = (id) => setSesionesConContenido(prev => ({ ...prev, [id]: !prev[id] }));

    const agregarOcurrencia = () => {
        const newId = Date.now();
        // Colapsar todas las existentes
        setSesionesExpandidas(prev => {
            const collapsed = {};
            Object.keys(prev).forEach(k => { collapsed[k] = false; });
            return { ...collapsed, [newId]: true };
        });
        setOcurrenciasProgramadas(prev => {
            const newExp = {};
            prev.forEach(oc => { newExp[oc.id] = false; });
            setSesionesExpandidas(e => ({ ...e, ...newExp, [newId]: true }));
            return [...prev, { id: newId, fecha: '', hora_inicio: '', hora_fin: '', facilitador: '', contenido: '' }];
        });
    };

    const eliminarOcurrencia = (id) => {
        setOcurrenciasProgramadas(prev => prev.filter(oc => oc.id !== id));
        setErroresOcurrencias(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    };

    const handleOcurrenciaChange = (id, campo, valor) => {
        setOcurrenciasProgramadas(prev =>
            prev.map(oc => oc.id === id ? { ...oc, [campo]: valor } : oc)
        );
        setErroresOcurrencias(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), [campo]: null }
        }));
    };

    const toggleRecurrente = () => {
        setEsRecurrente(prev => {
            if (prev) {
                setOcurrenciasProgramadas([]);
                setErroresOcurrencias({});
            }
            return !prev;
        });
    };

    const resetRecurrence = () => {
        setEsRecurrente(false);
        setOcurrenciasProgramadas([]);
        setErroresOcurrencias({});
    };

    return {
        esRecurrente,
        ocurrenciasProgramadas,
        erroresOcurrencias,
        sesionesExpandidas,
        sesionesConContenido,
        setErroresOcurrencias,
        agregarOcurrencia,
        eliminarOcurrencia,
        handleOcurrenciaChange,
        toggleRecurrente,
        toggleExpandida,
        toggleContenido,
        resetRecurrence
    };
};

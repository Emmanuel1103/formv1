import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { sesionesService } from '../../../../services/sesiones';
import { formatters } from '../../../../utils/formatters';

/**
 * Hook de lógica de negocio para VerAsistentes:
 * - Carga de sesiones y asistentes
 * - Selección de sesión/ocurrencia
 * - Exportación a XLSX
 */
export const useVerAsistentes = () => {
    const [sesiones, setSesiones] = useState([]);
    const [sesionSeleccionada, setSesionSeleccionada] = useState('');
    const [ocurrenciaSeleccionada, setOcurrenciaSeleccionada] = useState('__principal__');
    const [asistentes, setAsistentes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAsistentes, setLoadingAsistentes] = useState(false);
    const [toast, setToast] = useState(null);

    const sesionActual = sesiones.find(s => s.id === sesionSeleccionada);

    useEffect(() => { loadSesiones(); }, []); // eslint-disable-line

    useEffect(() => {
        if (sesionSeleccionada) loadAsistentes();
    }, [sesionSeleccionada, ocurrenciaSeleccionada]); // eslint-disable-line

    // ── Carga de datos ────────────────────────────────────────────────────────
    const loadSesiones = async () => {
        try {
            const data = await sesionesService.listar();
            setSesiones(data);
        } catch {
            setToast({ message: 'Error al cargar formaciones registradas', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const loadAsistentes = async () => {
        setLoadingAsistentes(true);
        try {
            const ocId = ocurrenciaSeleccionada !== '__principal__' ? ocurrenciaSeleccionada : null;
            const data = await sesionesService.obtenerAsistentes(sesionSeleccionada, ocId);
            setAsistentes(data);
        } catch {
            setToast({ message: 'Error al cargar asistentes', type: 'error' });
        } finally {
            setLoadingAsistentes(false);
        }
    };

    // ── Selección de sesión ───────────────────────────────────────────────────
    const handleSeleccionarSesion = (id) => {
        setSesionSeleccionada(id);
        setOcurrenciaSeleccionada('__principal__');
    };

    // ── Datos derivados para el panel de información ──────────────────────────
    const ocurrenciaActual = (() => {
        if (!sesionActual || ocurrenciaSeleccionada === '__principal__') return null;
        return (sesionActual.ocurrencias || []).find(oc => oc.id === ocurrenciaSeleccionada) || null;
    })();

    const fechaMostrada = ocurrenciaActual ? ocurrenciaActual.fecha : sesionActual?.fecha;

    const horaMostrada = ocurrenciaActual
        ? (ocurrenciaActual.hora_inicio && ocurrenciaActual.hora_fin
            ? `${ocurrenciaActual.hora_inicio} – ${ocurrenciaActual.hora_fin}`
            : 'Por definir')
        : (sesionActual ? `${sesionActual.hora_inicio} – ${sesionActual.hora_fin}` : '');

    const facilitadorMostrado = ocurrenciaActual?.facilitador || sesionActual?.facilitador;
    const totalSesiones = sesionActual ? 1 + (sesionActual.ocurrencias?.length || 0) : 0;

    // ── Exportar XLSX ─────────────────────────────────────────────────────────
    const exportarXLSX = async () => {
        if (!sesionActual) return;

        const workbook = new ExcelJS.Workbook();
        const esInterna = sesionActual.tipo_formacion === 'Interna';

        const encabezados = esInterna
            ? ['Cédula', 'Nombre completo', 'Cargo', 'Dirección', 'Correo electrónico', 'Fecha de registro', 'Hora de registro']
            : ['Cédula', 'Nombre completo', 'Empresa / Entidad', 'Cargo', 'Teléfono de contacto', 'Correo electrónico', 'Fecha de registro', 'Hora de registro'];

        // Helper para crear hojas
        const crearHoja = async (datosSesionRef, nombreHoja, identificador) => {
            // Fetch asistentes específico para esta ocurrencia si es necesario, o usar los actuales si coinciden
            let asistentesHojas = asistentes;
            if (identificador !== ocurrenciaSeleccionada) {
                try {
                    const ocId = identificador !== '__principal__' ? identificador : null;
                    asistentesHojas = await sesionesService.obtenerAsistentes(sesionSeleccionada, ocId);
                } catch {
                    asistentesHojas = [];
                }
            }

            const datos = asistentesHojas.map(a => {
                const [fechaStr = '', horaStr = ''] = formatters.fechaHora(a.fecha_registro).split(', ');
                return esInterna
                    ? [a.cedula || '', a.nombre || '', a.cargo || '', a.unidad || '', a.correo || '', fechaStr, horaStr]
                    : [a.cedula || '', a.nombre || '', a.empresa || '', a.cargo || '', a.telefono || '', a.correo || '', fechaStr, horaStr];
            });

            // Reemplazar caracteres no válidos para nombres de hoja en Excel
            const safeSheetName = nombreHoja.replace(/[\\/?*[\]]/g, '').substring(0, 31);
            const ws = workbook.addWorksheet(safeSheetName);

            const ref = (field) => datosSesionRef[field] || sesionActual[field];
            ws.addRow(['Formación:', ref('tema')]);
            ws.addRow(['Responsable:', ref('responsable')]);
            ws.addRow(['Cargo responsable:', ref('cargo')]);
            ws.addRow(['Facilitador:', ref('facilitador')]);
            ws.addRow(['Fecha sesión:', formatters.fechaCorta(datosSesionRef.fecha)]);
            ws.addRow(['Horario:', `${ref('hora_inicio')} - ${ref('hora_fin')}`]);

            const [h1, m1] = (ref('hora_inicio') || '0:0').split(':').map(Number);
            const [h2, m2] = (ref('hora_fin') || '0:0').split(':').map(Number);
            const horasDec = parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(2));
            const rowHoras = ws.addRow(['Horas de formación:', horasDec]);
            rowHoras.getCell(2).numFmt = '0.00';
            rowHoras.getCell(2).alignment = { horizontal: 'left' };

            ws.addRow(['Tipo de actividad:', ref('tipo_actividad')]);
            ws.addRow(['Tipo de formación:', ref('tipo_formacion')]);
            ws.addRow(['Modalidad:', ref('modalidad')]);
            ws.addRow(['Cantidad de asistentes:', asistentesHojas.length]);
            if (ref('contenido')) ws.addRow(['Descripción:', ref('contenido')]);

            ws.addRow([]);
            const rowTabla = ws.rowCount + 1;
            ws.addTable({
                name: `AsistentesTable_${safeSheetName.replace(/\s+/g, '_')}`,
                ref: `A${rowTabla}`,
                headerRow: true,
                style: { theme: 'TableStyleMedium9', showRowStripes: true },
                columns: encabezados.map(h => ({ name: h, filterButton: true })),
                rows: datos.length > 0 ? datos : [Array(encabezados.length).fill('')] // Asegurar que hay al menos una fila vacía para que la tabla no se rompa
            });

            // Estilos de cabecera
            ws.getRow(rowTabla).eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
            });
            ws.eachRow((row, rowNum) => {
                if (rowNum > rowTabla) {
                    row.eachCell((cell, colNum) => {
                        cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };

                        const headerName = encabezados[colNum - 1];
                        const cabecerasCentradas = ['Cédula', 'Cargo', 'Teléfono de contacto', 'Fecha de registro', 'Hora de registro'];

                        if (cabecerasCentradas.includes(headerName)) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        } else {
                            cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        }
                    });
                }
            });
            encabezados.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(h.length + 2, 18); });
        };

        // Lógica de exportación según selección
        if (sesionActual.es_recurrente && ocurrenciaSeleccionada === '__principal__') {
            // Exportar la sesión principal primero
            await crearHoja(sesionActual, `Sesión 1 (${formatters.fechaCorta(sesionActual.fecha)})`, '__principal__');

            // Luego cada ocurrencia
            if (sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0) {
                const ocurrenciasOrdenadas = [...sesionActual.ocurrencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                for (let i = 0; i < ocurrenciasOrdenadas.length; i++) {
                    const oc = ocurrenciasOrdenadas[i];
                    await crearHoja(oc, `Sesión ${i + 2} (${formatters.fechaCorta(oc.fecha)})`, oc.id);
                }
            }
        } else {
            // Exportar solo la seleccionada (principal en sesión no recurrente, o una ocurrencia específica)
            const datosSesionRef = ocurrenciaSeleccionada === '__principal__' ? sesionActual : (sesionActual.ocurrencias || []).find(oc => oc.id === ocurrenciaSeleccionada) || sesionActual;
            await crearHoja(datosSesionRef, 'Asistentes', ocurrenciaSeleccionada);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `asistentes_${sesionActual.tema || 'formación'}.xlsx`);
    };

    const exportarConsolidadoXLSX = async () => {
        if (!sesionActual) return;

        const workbook = new ExcelJS.Workbook();
        let asistentesConsolidados = [];

        try {
            const asisPrincipal = await sesionesService.obtenerAsistentes(sesionActual.id, null);
            asisPrincipal.forEach(a => asistentesConsolidados.push({ ...a, nombre_sesion: 'Sesión 1' }));
        } catch { }

        if (sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0) {
            for (let i = 0; i < sesionActual.ocurrencias.length; i++) {
                try {
                    const oc = sesionActual.ocurrencias[i];
                    const asisOc = await sesionesService.obtenerAsistentes(sesionActual.id, oc.id);
                    asisOc.forEach(a => asistentesConsolidados.push({ ...a, nombre_sesion: `Sesión ${i + 2}` }));
                } catch { }
            }
        }

        const esInterna = sesionActual.tipo_formacion === 'Interna';

        const encabezados = esInterna
            ? ['Sesión', 'Cédula', 'Nombre completo', 'Cargo', 'Dirección', 'Correo electrónico', 'Fecha de registro', 'Hora de registro']
            : ['Sesión', 'Cédula', 'Nombre completo', 'Empresa / Entidad', 'Cargo', 'Teléfono de contacto', 'Correo electrónico', 'Fecha de registro', 'Hora de registro'];

        const datos = asistentesConsolidados.map(a => {
            const [fechaStr = '', horaStr = ''] = formatters.fechaHora(a.fecha_registro).split(', ');
            return esInterna
                ? [a.nombre_sesion || '', a.cedula || '', a.nombre || '', a.cargo || '', a.unidad || '', a.correo || '', fechaStr, horaStr]
                : [a.nombre_sesion || '', a.cedula || '', a.nombre || '', a.empresa || '', a.cargo || '', a.telefono || '', a.correo || '', fechaStr, horaStr];
        });

        const ws = workbook.addWorksheet('Todos los Asistentes');

        // Calcular la suma total de horas y las fechas mínima/máxima
        let totalHorasFormacion = 0;
        let fechasTodas = [];

        const calcularHoras = (inicio, fin) => {
            if (!inicio || !fin) return 0;
            const [h1, m1] = inicio.split(':').map(Number);
            const [h2, m2] = fin.split(':').map(Number);
            return parseFloat(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60).toFixed(2));
        };

        // Sumar sesión principal
        if (sesionActual.hora_inicio && sesionActual.hora_fin) {
            totalHorasFormacion += calcularHoras(sesionActual.hora_inicio, sesionActual.hora_fin);
        }
        if (sesionActual.fecha) fechasTodas.push(new Date(sesionActual.fecha));

        // Sumar ocurrencias
        if (sesionActual.ocurrencias && sesionActual.ocurrencias.length > 0) {
            sesionActual.ocurrencias.forEach(oc => {
                if (oc.hora_inicio && oc.hora_fin) {
                    totalHorasFormacion += calcularHoras(oc.hora_inicio, oc.hora_fin);
                }
                if (oc.fecha) fechasTodas.push(new Date(oc.fecha));
            });
        }
        totalHorasFormacion = parseFloat(totalHorasFormacion.toFixed(2));

        let rangoFechasStr = '—';
        if (fechasTodas.length > 0) {
            const minFecha = new Date(Math.min(...fechasTodas));
            const maxFecha = new Date(Math.max(...fechasTodas));
            if (minFecha.getTime() === maxFecha.getTime()) {
                rangoFechasStr = formatters.fechaCorta(minFecha);
            } else {
                rangoFechasStr = `${formatters.fechaCorta(minFecha)} - ${formatters.fechaCorta(maxFecha)}`;
            }
        }

        const ref = (field) => sesionActual[field];
        ws.addRow(['Formación:', ref('tema')]);
        ws.addRow(['Responsable:', ref('responsable')]);
        ws.addRow(['Cargo responsable:', ref('cargo')]);
        ws.addRow(['Facilitador:', ref('facilitador')]);
        ws.addRow(['Rango de fechas:', rangoFechasStr]);

        const rowHoras = ws.addRow(['Horas de formación (Total):', totalHorasFormacion]);
        rowHoras.getCell(2).numFmt = '0.00';
        rowHoras.getCell(2).alignment = { horizontal: 'left' };

        ws.addRow(['Tipo de actividad:', ref('tipo_actividad')]);
        ws.addRow(['Tipo de formación:', ref('tipo_formacion')]);
        ws.addRow(['Modalidad:', ref('modalidad')]);
        ws.addRow(['Total registros:', asistentesConsolidados.length]);
        if (ref('contenido')) ws.addRow(['Descripción:', ref('contenido')]);
        ws.addRow([]);

        const rowTabla = ws.rowCount + 1;
        ws.addTable({
            name: `ConsolidadoTable_${Math.random().toString(36).substring(2, 9)}`,
            ref: `A${rowTabla}`,
            headerRow: true,
            style: { theme: 'TableStyleMedium9', showRowStripes: true },
            columns: encabezados.map(h => ({ name: h, filterButton: true })),
            rows: datos.length > 0 ? datos : [Array(encabezados.length).fill('')]
        });

        ws.getRow(rowTabla).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
        });
        ws.eachRow((row, rowNum) => {
            if (rowNum > rowTabla) {
                row.eachCell((cell, colNum) => {
                    cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
                    const headerName = encabezados[colNum - 1];
                    const cabecerasCentradas = ['Sesión', 'Cédula', 'Cargo', 'Teléfono de contacto', 'Fecha de registro', 'Hora de registro'];
                    if (cabecerasCentradas.includes(headerName)) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                });
            }
        });
        encabezados.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(h.length + 2, 18); });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `asistentes_consolidado_${sesionActual.tema || 'formacion'}.xlsx`);
    };

    return {
        sesiones, sesionSeleccionada, ocurrenciaSeleccionada, setOcurrenciaSeleccionada,
        asistentes, loading, loadingAsistentes, toast, setToast,
        sesionActual, ocurrenciaActual, fechaMostrada, horaMostrada,
        facilitadorMostrado, totalSesiones,
        handleSeleccionarSesion, exportarXLSX, exportarConsolidadoXLSX,
    };
};

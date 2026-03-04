import { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatters } from '../../../../utils/formatters';

export const useExportExcel = (sesiones, filtros, userEmail, setToast) => {
    const [showExportModal, setShowExportModal] = useState(false);

    const exportarXLSX = async (tipo = 'all') => {
        const sesionesBase = (tipo === 'mine')
            ? sesiones.filter(s => s.created_by === userEmail)
            : sesiones;

        const datosFiltradosFinales = sesionesBase.filter(sesion => {
            const cumpleBusqueda = !filtros.busqueda || sesion.tema?.toLowerCase().includes(filtros.busqueda.toLowerCase());
            const cumpleFecha = !filtros.fecha || sesion.fecha === filtros.fecha;
            const cumpleTipo = !filtros.tipo || sesion.tipo_actividad === filtros.tipo;
            const cumpleFacilitador = !filtros.facilitador || sesion.facilitador === filtros.facilitador;
            const cumpleResponsable = !filtros.responsable || sesion.responsable === filtros.responsable;
            const cumpleTipoFormacion = !filtros.tipo_formacion || sesion.tipo_formacion === filtros.tipo_formacion;
            const cumpleModalidad = !filtros.modalidad || sesion.modalidad === filtros.modalidad;
            return cumpleBusqueda && cumpleFecha && cumpleTipo && cumpleFacilitador && cumpleResponsable && cumpleTipoFormacion && cumpleModalidad;
        });

        if (datosFiltradosFinales.length === 0) {
            setToast({ message: 'No hay datos para exportar con estos filtros', type: 'error' });
            setShowExportModal(false);
            return;
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Formaciones');

        ws.columns = [
            { header: 'Tema', key: 'tema', width: 40 },
            { header: 'Sesión nro.', key: 'nro_sesion', width: 12 },
            { header: 'Fecha', key: 'fecha', width: 14 },
            { header: 'Hora inicio', key: 'hora_inicio', width: 12 },
            { header: 'Hora fin', key: 'hora_fin', width: 12 },
            { header: 'Horas de formación', key: 'horas_formacion', width: 18 },
            { header: 'Tipo de actividad', key: 'tipo_actividad', width: 20 },
            { header: 'Tipo de formación', key: 'tipo_formacion', width: 18 },
            { header: 'Modalidad', key: 'modalidad', width: 14 },
            { header: 'Facilitador', key: 'facilitador', width: 26 },
            { header: 'Responsable', key: 'responsable', width: 26 },
            { header: 'Cargo responsable', key: 'cargo', width: 26 },
            { header: 'Creado por', key: 'created_by_name', width: 26 },
            { header: 'Descripción / Contenido', key: 'contenido', width: 40 },
            { header: 'Asistentes', key: 'total_asistentes', width: 12 },
        ];

        datosFiltradosFinales.forEach(s => {
            ws.addRow({
                tema: s.tema,
                nro_sesion: s.es_recurrente ? 'Sesión 1' : 'Única',
                fecha: formatters.fecha(s.fecha),
                hora_inicio: s.hora_inicio,
                hora_fin: s.hora_fin,
                horas_formacion: s.hora_inicio && s.hora_fin ? parseFloat(((s.hora_fin.split(':').map(Number)[0] * 60 + s.hora_fin.split(':').map(Number)[1] - (s.hora_inicio.split(':').map(Number)[0] * 60 + s.hora_inicio.split(':').map(Number)[1])) / 60).toFixed(2)) : 0,
                tipo_actividad: s.tipo_actividad,
                tipo_formacion: s.tipo_formacion || '',
                modalidad: s.modalidad || '',
                facilitador: s.facilitador,
                responsable: s.responsable || '',
                cargo: s.cargo || '',
                created_by_name: s.created_by_name || s.created_by || '',
                contenido: s.contenido || '',
                total_asistentes: s.total_asistentes_principal || 0,
            });

            if (s.es_recurrente && s.ocurrencias && s.ocurrencias.length > 0) {
                const ocurrenciasOrdenadas = [...s.ocurrencias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                ocurrenciasOrdenadas.forEach((oc, index) => {
                    ws.addRow({
                        tema: oc.tema || s.tema,
                        nro_sesion: `Sesión ${index + 2}`,
                        fecha: formatters.fecha(oc.fecha),
                        hora_inicio: oc.hora_inicio || s.hora_inicio,
                        hora_fin: oc.hora_fin || s.hora_fin,
                        horas_formacion: (oc.hora_inicio || s.hora_inicio) && (oc.hora_fin || s.hora_fin) ? parseFloat((((oc.hora_fin || s.hora_fin).split(':').map(Number)[0] * 60 + (oc.hora_fin || s.hora_fin).split(':').map(Number)[1] - ((oc.hora_inicio || s.hora_inicio).split(':').map(Number)[0] * 60 + (oc.hora_inicio || s.hora_inicio).split(':').map(Number)[1])) / 60).toFixed(2)) : 0,
                        tipo_actividad: oc.tipo_actividad || s.tipo_actividad,
                        tipo_formacion: oc.tipo_formacion || s.tipo_formacion || '',
                        modalidad: oc.modalidad || s.modalidad || '',
                        facilitador: oc.facilitador || s.facilitador,
                        responsable: oc.responsable || s.responsable || '',
                        cargo: oc.cargo || s.cargo || '',
                        created_by_name: s.created_by_name || s.created_by || '',
                        contenido: oc.contenido || s.contenido || '',
                        total_asistentes: oc.total_asistentes || 0,
                    });
                });
            }
        });

        const columnasCentradas = ['nro_sesion', 'fecha', 'hora_inicio', 'hora_fin', 'horas_formacion', 'tipo_formacion', 'modalidad', 'total_asistentes'];

        ws.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                const columnKey = ws.getColumn(colNumber).key;
                const isCenterColumn = columnasCentradas.includes(columnKey);

                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };

                if (rowNumber === 1 || isCenterColumn) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                }

                if (rowNumber === 1) {
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF26BC58' } };
                }
                if (rowNumber > 1 && cell.address.includes('F')) {
                    cell.numFmt = '0.00';
                }
            });
        });

        ws.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: ws.rowCount, column: ws.columnCount }
        };

        const nombreArchivo = tipo === 'mine' ? 'Mis formaciones.xlsx' : 'Todas las formaciones.xlsx';
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo);
        setToast({ message: '¡Archivo exportado!', type: 'success' });
        setShowExportModal(false);
    };

    return {
        showExportModal,
        setShowExportModal,
        exportarXLSX
    };
};

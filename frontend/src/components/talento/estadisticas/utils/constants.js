export const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DIMENSION_LABELS = {
    facilitador: 'Facilitador',
    responsable: 'Responsable',
    cargo: 'Cargo del responsable',
    tipo_formacion: 'Tipo de formación',
    tipo_actividad: 'Tipo de actividad',
    modalidad: 'Modalidad',
    mes: 'Análisis mensual'
};

export const METRIC_LABELS = {
    horas: 'Horas impartidas',
    cantidad: 'Sesiones',
    asistentes: 'Total asistentes',
    asistentes_promedio: 'Promedio asistentes'
};

export const DIMENSION_METRICS_MAP = {
    facilitador: [
        { label: METRIC_LABELS.horas, value: 'horas' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' },
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.asistentes_promedio, value: 'asistentes_promedio' }
    ],
    responsable: [
        { label: METRIC_LABELS.cantidad, value: 'cantidad' },
        { label: METRIC_LABELS.asistentes, value: 'asistentes' }
    ],
    cargo: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ],
    tipo_formacion: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.horas, value: 'horas' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ],
    tipo_actividad: [
        { label: METRIC_LABELS.cantidad, value: 'cantidad' },
        { label: METRIC_LABELS.asistentes, value: 'asistentes' }
    ],
    modalidad: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ],
    mes: [
        { label: METRIC_LABELS.asistentes, value: 'asistentes' },
        { label: METRIC_LABELS.horas, value: 'horas' },
        { label: METRIC_LABELS.cantidad, value: 'cantidad' }
    ]
};

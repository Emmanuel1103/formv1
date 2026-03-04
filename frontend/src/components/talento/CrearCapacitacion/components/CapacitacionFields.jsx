import React from 'react';
import { Input, Select, Radio as RadioGroup } from '../../../common';

const TIPOS_ACTIVIDAD = ['Capacitación', 'Inducción', 'Formación', 'Otros (eventos)'];
const MODALIDADES = ['Virtual', 'Presencial', 'Híbrida'];
const TIPOS_FORMACION = ['Interna', 'Externa'];

const CapacitacionFields = ({ formData, handleChange, errors, customTipo }) => {
    return (
        <>
            <Input
                label="Tema / Título"
                name="tema"
                value={formData.tema}
                onChange={handleChange}
                error={errors.tema}
                placeholder="Ej: Inducción a la organización"
                required
            />

            <div className="form-row">
                <Input
                    label="Fecha"
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    error={errors.fecha}
                    required
                />
                <Select
                    label="Modalidad"
                    name="modalidad"
                    value={formData.modalidad}
                    onChange={handleChange}
                    options={MODALIDADES}
                    error={errors.modalidad}
                    required
                />
            </div>

            <div className="form-row" style={{ alignItems: 'center' }}>
                <Select
                    label="Actividad"
                    name="tipo_actividad"
                    value={formData.tipo_actividad}
                    onChange={handleChange}
                    options={TIPOS_ACTIVIDAD}
                    error={errors.tipo_actividad}
                    required
                />
                <RadioGroup
                    label="Tipo de formación"
                    name="tipo_formacion"
                    options={TIPOS_FORMACION}
                    value={formData.tipo_formacion}
                    onChange={handleChange}
                    error={errors.tipo_formacion}
                    required
                />
            </div>

            {formData.tipo_actividad === 'Otros (eventos)' && (
                <div style={{ marginBottom: '20px' }}>
                    <Input
                        label="Especificar tipo de actividad"
                        name="custom_tipo"
                        value={customTipo}
                        onChange={handleChange}
                        error={errors.custom_tipo}
                        placeholder="Escribe el tipo de actividad"
                        required
                    />
                </div>
            )}

            <Input
                label="Facilitador"
                name="facilitador"
                value={formData.facilitador}
                onChange={handleChange}
                error={errors.facilitador}
                placeholder="Ej: Nicolas Ojeda"
                required
            />

            <div className="form-row">
                <Input
                    label="Responsable"
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleChange}
                    error={errors.responsable}
                    placeholder="¿Quién organiza la formación?"
                    required
                />
                <Input
                    label="Cargo del responsable"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    error={errors.cargo}
                    placeholder="Ej: Coordinador de Talento Humano"
                    required
                />
            </div>

            <div className="form-group">
                <label className="input-label">
                    Contenido (mínimo 10 caracteres)<span className="required">*</span>
                </label>
                <textarea
                    name="contenido"
                    value={formData.contenido}
                    onChange={handleChange}
                    className={`textarea ${errors.contenido ? 'input-error' : ''}`}
                    placeholder="Escribe aquí los temas principales (mínimo 10 caracteres)..."
                    rows={5}
                />
                {errors.contenido && <span className="error-message">{errors.contenido}</span>}
            </div>

            <div className="form-row">
                <Input
                    label="Hora de inicio"
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    error={errors.hora_inicio}
                    required
                />
                <Input
                    label="Hora de fin"
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleChange}
                    error={errors.hora_fin}
                    required
                />
            </div>
        </>
    );
};

export default CapacitacionFields;

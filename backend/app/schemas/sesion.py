from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
import re

# ─── Ocurrencias ───────────────────────────────────────────────────────────

class OcurrenciaCreate(BaseModel):
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    hora_inicio: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    facilitador: Optional[str] = Field(None, min_length=3, max_length=100)
    contenido: Optional[str] = Field(None, max_length=2000)
    tipo_actividad: Optional[str] = None
    tipo_formacion: Optional[str] = None
    modalidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    tema: Optional[str] = None

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if v is None:
            return v
        if values.get('hora_inicio') and v <= values['hora_inicio']:
            raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

class OcurrenciaUpdate(BaseModel):
    fecha: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    hora_inicio: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    facilitador: Optional[str] = Field(None, min_length=3, max_length=100)
    contenido: Optional[str] = Field(None, max_length=2000)
    tipo_actividad: Optional[str] = None
    tipo_formacion: Optional[str] = None
    modalidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    tema: Optional[str] = None

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if v is None:
            return v
        if values.get('hora_inicio') and v <= values['hora_inicio']:
            raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

class OcurrenciaResponse(BaseModel):
    id: str
    fecha: str
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    facilitador: Optional[str] = None
    contenido: Optional[str] = None
    tipo_actividad: Optional[str] = None
    tipo_formacion: Optional[str] = None
    modalidad: Optional[str] = None
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    tema: Optional[str] = None
    token: str
    link: str
    token_active: bool
    token_expiry: str
    created_at: str
    total_asistentes: Optional[int] = 0

# ─── Sesión ────────────────────────────────────────────────────────────────

class SesionCreate(BaseModel):
    tema: str = Field(..., min_length=3, max_length=200)
    fecha: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    tipo_actividad: str = Field(..., pattern=r'^(Inducción|Formación|Capacitación|Otros|Otros \(eventos\))$')
    # Campo opcional para especificar tipo cuando se elige 'Otros'
    tipo_actividad_custom: Optional[str] = None
    facilitador: str = Field(..., min_length=3, max_length=100)
    responsable: str = Field(..., min_length=3, max_length=100)
    cargo: str = Field(..., min_length=3, max_length=100)
    contenido: str = Field(..., min_length=10)
    hora_inicio: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: str = Field(..., pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    tipo_formacion: str = Field(..., pattern=r'^(Interna|Externa)$')
    modalidad: str = Field(..., pattern=r'^(Virtual|Presencial|Híbrida)$')
    # ── Recurrencia ──
    es_recurrente: bool = False
    ocurrencias_programadas: List[OcurrenciaCreate] = []

    @validator('facilitador', 'tema', 'responsable', 'cargo')
    def validate_no_special_chars(cls, v):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if 'hora_inicio' in values:
            if v <= values['hora_inicio']:
                raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

    @validator('tipo_actividad_custom')
    def validate_custom_tipo(cls, v, values):
        if v is None:
            return v
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError('tipo_actividad_custom debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

class SesionResponse(BaseModel):
    id: str
    token: str
    tema: str
    fecha: str
    tipo_actividad: str
    facilitador: str
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    contenido: str
    hora_inicio: str
    hora_fin: str
    tipo_formacion: str = "Interna"
    modalidad: str = "Presencial"
    link: str
    qr_code: Optional[str] = None  # Deprecated
    qr_filename: Optional[str] = None  # Deprecated
    token_expiry: str
    token_active: bool
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: str
    updated_at: str
    total_asistentes: Optional[int] = 0
    total_asistentes_principal: Optional[int] = 0
    # ── Recurrencia ──
    es_recurrente: bool = False
    ocurrencias: List[OcurrenciaResponse] = []

    class Config:
        from_attributes = True

class SesionUpdate(BaseModel):
    tema: Optional[str] = Field(None, min_length=3, max_length=200)
    fecha: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    tipo_actividad: Optional[str] = None
    tipo_actividad_custom: Optional[str] = None
    facilitador: Optional[str] = Field(None, min_length=3, max_length=100)
    responsable: Optional[str] = Field(None, min_length=3, max_length=100)
    cargo: Optional[str] = Field(None, min_length=3, max_length=100)
    contenido: Optional[str] = Field(None, min_length=10)
    hora_inicio: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    hora_fin: Optional[str] = Field(None, pattern=r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
    tipo_formacion: Optional[str] = Field(None, pattern=r'^(Interna|Externa)$')
    modalidad: Optional[str] = Field(None, pattern=r'^(Virtual|Presencial|Híbrida)$')

    @validator('facilitador', 'tema', 'responsable', 'cargo')
    def validate_no_special_chars(cls, v):
        if v is None:
            return v
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

    @validator('hora_fin')
    def validate_hora_fin(cls, v, values):
        if v is None:
            return v
        if 'hora_inicio' in values and values['hora_inicio']:
            if v <= values['hora_inicio']:
                raise ValueError('Hora fin debe ser posterior a hora inicio')
        return v

    @validator('tipo_actividad_custom')
    def validate_custom_tipo(cls, v, values):
        if v is None:
            return v
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError('tipo_actividad_custom debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]+$', v):
            raise ValueError('Contiene caracteres no permitidos')
        return v.strip()

class SesionPublicResponse(BaseModel):
    tema: str
    fecha: str
    facilitador: str
    responsable: Optional[str] = None
    cargo: Optional[str] = None
    contenido: str
    hora_inicio: str
    hora_fin: str
    tipo_actividad: str
    tipo_formacion: str = "Interna"
    modalidad: str = "Presencial"

import json
import os
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import sys
from pathlib import Path
import qrcode
from io import BytesIO
import base64
sys.path.append(str(Path(__file__).parent.parent))

from core.config import settings
from core.exceptions import TokenNotFoundException, TokenExpiredException, TokenInactiveException
from storage import get_storage_adapter

# Importar cliente CosmosDB
try:
    from db.cosmos_client import cosmos_db
    COSMOS_AVAILABLE = cosmos_db is not None
    if not COSMOS_AVAILABLE:
        print("⚠️ CosmosDB no disponible: No se pudo crear la instancia")
except Exception as e:
    print(f"⚠️ CosmosDB no disponible: {e}")
    COSMOS_AVAILABLE = False
    cosmos_db = None

# Configuración de archivos JSON (fallback)
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "sesiones.json"

def ensure_data_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)

def load_sesiones() -> List[dict]:
    ensure_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_sesiones(sesiones: List[dict]):
    ensure_data_file()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(sesiones, f, ensure_ascii=False, indent=2)

def generar_qr_dinamico(link: str) -> bytes:
    """
    Genera un código QR dinámicamente y retorna los bytes de la imagen.
    No guarda el QR en storage.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(link)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return buffered.getvalue()

def _generar_ocurrencia(fecha: str, hora_inicio: Optional[str], hora_fin: Optional[str], facilitador: Optional[str] = None, contenido: Optional[str] = None, tipo_actividad: Optional[str] = None, tipo_formacion: Optional[str] = None, modalidad: Optional[str] = None, responsable: Optional[str] = None, cargo: Optional[str] = None, tema: Optional[str] = None) -> dict:
    """Genera el dict de una ocurrencia con su propio token y link."""
    token = uuid.uuid4().hex[:8].upper()
    expiry = (datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)).isoformat()
    link = f"{settings.FRONTEND_URL}/registro?token={token}"
    return {
        "id": str(uuid.uuid4()),
        "fecha": fecha,
        "hora_inicio": hora_inicio,
        "hora_fin": hora_fin,
        "facilitador": facilitador,
        "contenido": contenido,
        "tipo_actividad": tipo_actividad,
        "tipo_formacion": tipo_formacion,
        "modalidad": modalidad,
        "responsable": responsable,
        "cargo": cargo,
        "tema": tema,
        "token": token,
        "link": link,
        "token_active": True,
        "token_expiry": expiry,
        "created_at": datetime.utcnow().isoformat(),
    }

# ========== FUNCIONES PRINCIPALES ==========

def crear_sesion(sesion_data: dict) -> dict:
    """Crear sesión en CosmosDB o JSON según configuración"""
    
    sesion_id = str(uuid.uuid4())
    token = uuid.uuid4().hex[:8].upper()
    now = datetime.utcnow().isoformat()
    expiry = (datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)).isoformat()
    
    link = f"{settings.FRONTEND_URL}/registro?token={token}"

    # Extraer ocurrencias programadas antes de construir el doc
    ocurrencias_programadas = sesion_data.pop('ocurrencias_programadas', [])
    
    nueva_sesion = {
        "id": sesion_id,
        "token": token,
        "link": link,
        "token_expiry": expiry,
        "token_active": True,
        "created_at": now,
        "updated_at": now,
        "ocurrencias": [],
        **sesion_data
    }

    # Generar ocurrencias adicionales si es recurrente
    if nueva_sesion.get('es_recurrente') and ocurrencias_programadas:
        for oc in ocurrencias_programadas:
            # Normalizar datos de ocurrencia
            oc_data = oc if isinstance(oc, dict) else oc.dict()
            
            # Aplicar herencia persistente: si el campo es None/vacío, tomar de la principal
            fecha = oc_data.get('fecha')
            h_inicio = oc_data.get('hora_inicio') or nueva_sesion.get('hora_inicio')
            h_fin = oc_data.get('hora_fin') or nueva_sesion.get('hora_fin')
            facilitador = oc_data.get('facilitador') or nueva_sesion.get('facilitador')
            contenido = oc_data.get('contenido') or nueva_sesion.get('contenido')
            t_actividad = oc_data.get('tipo_actividad') or nueva_sesion.get('tipo_actividad')
            t_formacion = oc_data.get('tipo_formacion') or nueva_sesion.get('tipo_formacion')
            modalidad = oc_data.get('modalidad') or nueva_sesion.get('modalidad')
            responsable = oc_data.get('responsable') or nueva_sesion.get('responsable')
            cargo = oc_data.get('cargo') or nueva_sesion.get('cargo')
            tema = oc_data.get('tema') or nueva_sesion.get('tema')
            
            nueva_sesion["ocurrencias"].append(
                _generar_ocurrencia(
                    fecha, h_inicio, h_fin, facilitador, contenido,
                    t_actividad, t_formacion, modalidad, responsable, cargo, tema
                )
            )
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.crear_sesion(nueva_sesion)
    else:
        sesiones = load_sesiones()
        sesiones.append(nueva_sesion)
        save_sesiones(sesiones)
        return nueva_sesion

def get_all_sesiones(owner_email: Optional[str] = None, tipos_actividad: Optional[List[str]] = None) -> List[dict]:
    """Listar sesiones. Si se proporciona owner_email, devuelve solo las de ese propietario. Filtra por tipos si se proveen."""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.listar_sesiones(owner_email, tipos_actividad)
    else:
        sesiones = load_sesiones()
        if owner_email:
            sesiones = [s for s in sesiones if s.get('created_by') == owner_email]
        if tipos_actividad:
            sesiones = [s for s in sesiones if s.get('tipo_actividad') in tipos_actividad]
        sesiones.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return sesiones

def get_sesiones_para_admin(admin_email: str) -> List[dict]:
    """Obtener sesiones para vista administrativa: Propias + Global (Inducción/Formación)."""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.listar_sesiones_admin(admin_email)
    else:
        sesiones = load_sesiones()
        # Propias o de tipo Inducción/Formación
        admin_sesiones = [
            s for s in sesiones 
            if s.get('created_by') == admin_email or s.get('tipo_actividad') in ['Inducción', 'Formación', 'Capacitación']
        ]
        admin_sesiones.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return admin_sesiones

def get_sesion_by_id(sesion_id: str) -> Optional[dict]:
    """Obtener sesión por ID"""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        return cosmos_db.obtener_sesion(sesion_id)
    else:
        sesiones = load_sesiones()
        for sesion in sesiones:
            if sesion['id'] == sesion_id:
                return sesion
        return None

def get_sesion_by_token(token: str) -> dict:
    """Obtener sesión por token con validaciones. Busca también en ocurrencias."""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion_por_token(token)
        # Si el token no coincide con el de la raíz, es porque hizo match en una ocurrencia
        # Debemos mezclar los datos de la ocurrencia para que el formulario sea correcto
        if sesion and sesion.get('token') != token:
            for oc in sesion.get('ocurrencias', []):
                if oc.get('token') == token:
                    sesion = {**sesion, **{
                        'token': oc['token'],
                        'link': oc['link'],
                        'token_active': oc.get('token_active', True),
                        'token_expiry': oc['token_expiry'],
                        'fecha': oc['fecha'],
                        'tema': oc.get('tema') or sesion.get('tema', ''),
                        'hora_inicio': oc.get('hora_inicio') or sesion.get('hora_inicio', ''),
                        'hora_fin': oc.get('hora_fin') or sesion.get('hora_fin', ''),
                        'facilitador': oc.get('facilitador') or sesion.get('facilitador', ''),
                        'contenido': oc.get('contenido') or sesion.get('contenido', ''),
                        'tipo_actividad': oc.get('tipo_actividad') or sesion.get('tipo_actividad', ''),
                        'tipo_formacion': oc.get('tipo_formacion') or sesion.get('tipo_formacion', ''),
                        'modalidad': oc.get('modalidad') or sesion.get('modalidad', ''),
                        'responsable': oc.get('responsable') or sesion.get('responsable', ''),
                        'cargo': oc.get('cargo') or sesion.get('cargo', ''),
                        '_ocurrencia_id': oc['id'],
                    }}
                    break
    else:
        sesiones = load_sesiones()
        sesion = next((s for s in sesiones if s['token'] == token), None)

        # Si no encontró por token raíz, buscar en ocurrencias
        if not sesion:
            for s in sesiones:
                for oc in s.get('ocurrencias', []):
                    if oc.get('token') == token:
                        # Retornar sesión padre con datos de la ocurrencia sobreescritos
                        merged = {**s, **{
                            'token': oc['token'],
                            'link': oc['link'],
                            'token_active': oc.get('token_active', True),
                            'token_expiry': oc['token_expiry'],
                            'fecha': oc['fecha'],
                            'tema': oc.get('tema') or s.get('tema', ''),
                            'hora_inicio': oc.get('hora_inicio') or s.get('hora_inicio', ''),
                            'hora_fin': oc.get('hora_fin') or s.get('hora_fin', ''),
                            'facilitador': oc.get('facilitador') or s.get('facilitador', ''),
                            'contenido': oc.get('contenido') or s.get('contenido', ''),
                            'tipo_actividad': oc.get('tipo_actividad') or s.get('tipo_actividad', ''),
                            'tipo_formacion': oc.get('tipo_formacion') or s.get('tipo_formacion', ''),
                            'modalidad': oc.get('modalidad') or s.get('modalidad', ''),
                            'responsable': oc.get('responsable') or s.get('responsable', ''),
                            'cargo': oc.get('cargo') or s.get('cargo', ''),
                            '_ocurrencia_id': oc['id'],
                        }}
                        sesion = merged
                        break
                if sesion:
                    break
    
    if not sesion:
        raise TokenNotFoundException()
    
    if not sesion.get('token_active', True):
        raise TokenInactiveException()
    
    expiry = datetime.fromisoformat(sesion['token_expiry'])
    if datetime.utcnow() > expiry:
        raise TokenExpiredException()
    
    return sesion

def actualizar_sesion(sesion_id: str, datos_actualizacion: dict) -> dict:
    """Actualizar sesión con los datos proporcionados"""
    now = datetime.utcnow().isoformat()
    datos_actualizacion['updated_at'] = now
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # Obtener sesión actual
        sesion_actual = cosmos_db.obtener_sesion(sesion_id)
        if not sesion_actual:
            raise ValueError("Sesión no encontrada")
        
        # Actualizar solo los campos proporcionados
        sesion_actual.update(datos_actualizacion)
        return cosmos_db.actualizar_sesion(sesion_id, sesion_actual)
    else:
        sesiones = load_sesiones()
        for i, sesion in enumerate(sesiones):
            if sesion['id'] == sesion_id:
                # Actualizar solo los campos proporcionados
                sesiones[i].update(datos_actualizacion)
                save_sesiones(sesiones)
                return sesiones[i]
        raise ValueError("Sesión no encontrada")

def agregar_ocurrencia(sesion_id: str, fecha: str, hora_inicio: Optional[str], hora_fin: Optional[str], facilitador: Optional[str] = None, contenido: Optional[str] = None, tipo_actividad: Optional[str] = None, tipo_formacion: Optional[str] = None, modalidad: Optional[str] = None, responsable: Optional[str] = None, cargo: Optional[str] = None, tema: Optional[str] = None) -> dict:
    """Añadir una nueva ocurrencia/fecha a una sesión recurrente."""
    
    # Obtener sesión para aplicar herencia
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion(sesion_id)
    else:
        sesiones = load_sesiones()
        sesion = next((s for s in sesiones if s['id'] == sesion_id), None)
        
    if not sesion:
        raise ValueError("Sesión no encontrada")
        
    # Aplicar herencia persistente
    hora_inicio = hora_inicio or sesion.get('hora_inicio')
    hora_fin = hora_fin or sesion.get('hora_fin')
    facilitador = facilitador or sesion.get('facilitador')
    contenido = contenido or sesion.get('contenido')
    tipo_actividad = tipo_actividad or sesion.get('tipo_actividad')
    tipo_formacion = tipo_formacion or sesion.get('tipo_formacion')
    modalidad = modalidad or sesion.get('modalidad')
    responsable = responsable or sesion.get('responsable')
    cargo = cargo or sesion.get('cargo')
    tema = tema or sesion.get('tema')
    
    nueva_oc = _generar_ocurrencia(fecha, hora_inicio, hora_fin, facilitador, contenido, tipo_actividad, tipo_formacion, modalidad, responsable, cargo, tema)
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        ocurrencias = sesion.get('ocurrencias', [])
        ocurrencias.append(nueva_oc)
        sesion['ocurrencias'] = ocurrencias
        sesion['es_recurrente'] = True
        sesion['updated_at'] = datetime.utcnow().isoformat()
        cosmos_db.actualizar_sesion(sesion_id, sesion)
    else:
        for i, s in enumerate(sesiones):
            if s['id'] == sesion_id:
                if 'ocurrencias' not in sesiones[i]:
                    sesiones[i]['ocurrencias'] = []
                sesiones[i]['ocurrencias'].append(nueva_oc)
                sesiones[i]['es_recurrente'] = True
                sesiones[i]['updated_at'] = datetime.utcnow().isoformat()
                save_sesiones(sesiones)
                return nueva_oc
    
    return nueva_oc

def eliminar_ocurrencia(sesion_id: str, ocurrencia_id: str) -> bool:
    """Eliminar una ocurrencia de una sesión."""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion(sesion_id)
        if not sesion:
            raise ValueError("Sesión no encontrada")
        ocurrencias = sesion.get('ocurrencias', [])
        nuevas = [oc for oc in ocurrencias if oc['id'] != ocurrencia_id]
        if len(nuevas) == len(ocurrencias):
            return False
        sesion['ocurrencias'] = nuevas
        sesion['updated_at'] = datetime.utcnow().isoformat()
        cosmos_db.actualizar_sesion(sesion_id, sesion)
        return True
    else:
        sesiones = load_sesiones()
        for i, s in enumerate(sesiones):
            if s['id'] == sesion_id:
                ocurrencias = s.get('ocurrencias', [])
                nuevas = [oc for oc in ocurrencias if oc['id'] != ocurrencia_id]
                if len(nuevas) == len(ocurrencias):
                    return False
                sesiones[i]['ocurrencias'] = nuevas
                sesiones[i]['updated_at'] = datetime.utcnow().isoformat()
                save_sesiones(sesiones)
                return True
        raise ValueError("Sesión no encontrada")

def actualizar_ocurrencia(sesion_id: str, ocurrencia_id: str, data: dict) -> dict:
    """Actualizar datos de una ocurrencia específica."""
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        sesion = cosmos_db.obtener_sesion(sesion_id)
        if not sesion:
            raise ValueError("Sesión no encontrada")
        
        ocurrencias = sesion.get('ocurrencias', [])
        actualizada = None
        for oc in ocurrencias:
            if oc['id'] == ocurrencia_id:
                for key in ['fecha', 'hora_inicio', 'hora_fin', 'facilitador', 'contenido', 'tipo_actividad', 'tipo_formacion', 'modalidad', 'responsable', 'cargo', 'tema']:
                    if key in data:
                        # Aplicar herencia persistente si el valor es vacío (y no es fecha)
                        val = data[key]
                        if key != 'fecha' and not val:
                            val = sesion.get(key)
                        oc[key] = val
                actualizada = oc
                break
        
        if not actualizada:
            raise ValueError("Ocurrencia no encontrada")
            
        sesion['ocurrencias'] = ocurrencias
        sesion['updated_at'] = datetime.utcnow().isoformat()
        cosmos_db.actualizar_sesion(sesion_id, sesion)
        return actualizada
    else:
        sesiones = load_sesiones()
        for i, s in enumerate(sesiones):
            if s['id'] == sesion_id:
                ocurrencias = s.get('ocurrencias', [])
                for oc in ocurrencias:
                    if oc['id'] == ocurrencia_id:
                        for key in ['fecha', 'hora_inicio', 'hora_fin', 'facilitador', 'contenido', 'tipo_actividad', 'tipo_formacion', 'modalidad', 'responsable', 'cargo', 'tema']:
                            if key in data:
                                # Aplicar herencia persistente si el valor es vacío
                                val = data[key]
                                if key != 'fecha' and not val:
                                    val = s.get(key)
                                oc[key] = val
                        sesiones[i]['updated_at'] = datetime.utcnow().isoformat()
                        save_sesiones(sesiones)
                        return oc
        raise ValueError("Sesión o ocurrencia no encontrada")

def delete_sesion(sesion_id: str) -> bool:
    """Eliminar sesión"""
    from app.storage import get_storage_adapter
    
    if settings.STORAGE_MODE == "cosmosdb" and COSMOS_AVAILABLE:
        # Get session info before deleting
        sesion = get_sesion_by_id(sesion_id)
        
        # Delete from CosmosDB
        cosmos_db.eliminar_sesion(sesion_id)
        
        # Delete training folder from Azure if using Azure storage
        if sesion and settings.BLOB_STORAGE_MODE == "azure":
            storage = get_storage_adapter()
            if hasattr(storage, 'delete_training_folder'):
                created_by = sesion.get('created_by', '')
                nombre = sesion.get('tema', '')
                storage.delete_training_folder(created_by, nombre)
        
        return True
    else:
        # Get session info before deleting
        sesiones = load_sesiones()
        sesion = next((s for s in sesiones if s['id'] == sesion_id), None)
        
        # Delete from JSON
        new_sesiones = [s for s in sesiones if s['id'] != sesion_id]
        if len(new_sesiones) == len(sesiones):
            return False
        save_sesiones(new_sesiones)
        
        # Delete training folder from Azure if using Azure storage
        if sesion and settings.BLOB_STORAGE_MODE == "azure":
            storage = get_storage_adapter()
            if hasattr(storage, 'delete_training_folder'):
                created_by = sesion.get('created_by', '')
                nombre = sesion.get('tema', '')
                storage.delete_training_folder(created_by, nombre)
        
        return True

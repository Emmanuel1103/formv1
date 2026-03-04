import sys
import uuid
import random
from datetime import datetime, timedelta
from pathlib import Path

# Añadir el directorio app al sys.path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from db.cosmos_client import cosmos_db
from core.config import settings

def clean_and_generate(email_target):
    print(f"🧹 Buscando y limpiando sesiones previas de {email_target}...")
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        sesiones_previas = cosmos_db.listar_sesiones(owner_email=email_target)
        for s in sesiones_previas:
            print(f"   Eliminando sesión: {s['id']}")
            cosmos_db.eliminar_asistentes_por_sesion(s['id'])
            cosmos_db.eliminar_sesion(s['id'])
    
    # También limpiar admin por si acaso
    admin_email = f"admin{settings.ALLOWED_DOMAIN}"
    if email_target != admin_email:
        print(f"🧹 Limpiando sesiones de admin...")
        sesiones_admin = cosmos_db.listar_sesiones(owner_email=admin_email)
        for s in sesiones_admin:
            cosmos_db.eliminar_asistentes_por_sesion(s['id'])
            cosmos_db.eliminar_sesion(s['id'])

    print(f"🚀 Generando 20 sesiones para {email_target}...")
    # ... (el mismo código de generación de antes pero con email_target)
    temas = [
        "Liderazgo Transformacional", "Gestión del Tiempo", "Excel Avanzado", 
        "Comunicación Asertiva", "Habilidades de Negociación", "Inteligencia Emocional",
        "Trabajo en Equipo", "Seguridad de la Información", "Protección de Datos",
        "Cultura Organizacional", "Ventas Consultivas", "Atención al Cliente",
        "Design Thinking", "Metodologías Ágiles", "Scrum Master Prep",
        "Python para Análisis de Datos", "Dashboarding con Power BI",
        "Salud Mental en el Trabajo", "Prevención de Riesgos", "Primeros Auxilios"
    ]
    
    facilitadores = ["Juan Pérez", "María Rodríguez", "Carlos Gómez", "Ana Martínez"]
    responsables = ["Gerencia General", "Dirección de Talento Humano", "Área de Operaciones"]
    cargos = ["Gerente de Proyecto", "Analista Senior", "Coordinador de Formación"]
    modalidades = ["Virtual", "Presencial", "Híbrida"]
    tipos_formacion = ["Interna", "Externa"]
    tipos_actividad = ["Inducción", "Formación"]
    unidades = ["Unidad 1", "Unidad 2", "Unidad 3", "Dirección Central", "Sede Norte"]

    for i in range(20):
        tema = temas[i % len(temas)]
        dias_atras = random.randint(1, 180)
        fecha_obj = datetime.now() - timedelta(days=dias_atras)
        fecha_str = fecha_obj.strftime("%Y-%m-%d")
        
        h_inicio = random.randint(8, 14)
        h_fin = h_inicio + random.randint(1, 4)
        hora_inicio = f"{h_inicio:02d}:00"
        hora_fin = f"{h_fin:02d}:00"
        
        token = uuid.uuid4().hex[:8].upper()
        sesion_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        expiry = (datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)).isoformat()
        
        sesion = {
            "id": sesion_id,
            "tema": tema,
            "fecha": fecha_str,
            "token": token,
            "link": f"{settings.FRONTEND_URL}/registro?token={token}",
            "token_expiry": expiry,
            "token_active": True,
            "facilitador": random.choice(facilitadores),
            "responsable": random.choice(responsables),
            "cargo": random.choice(cargos),
            "contenido": f"Contenido para {tema}",
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "tipo_formacion": random.choice(tipos_formacion),
            "modalidad": random.choice(modalidades),
            "tipo_actividad": random.choice(tipos_actividad),
            "created_by": email_target,
            "created_at": now,
            "updated_at": now
        }
        
        cosmos_db.crear_sesion(sesion)
        
        # Asistentes
        num_asist = random.randint(5, 15)
        for _ in range(num_as_ist):
            asistente = {
                "id": str(uuid.uuid4()),
                "sesion_id": sesion_id,
                "token": token,
                "cedula": str(random.randint(10000000, 99999999)),
                "nombre": f"Asistente {random.randint(1, 1000)}",
                "cargo": random.choice(cargos),
                "unidad": random.choice(unidades),
                "correo": f"asist{random.randint(1,1000)}@example.com",
                "firma_url": "https://via.placeholder.com/200x100",
                "fecha_registro": now
            }
            cosmos_db.asistentes_container.create_item(body=asistente)
        
        print(f"✅ [{i+1}/20] Creada {tema}")

if __name__ == "__main__":
    # Según list_users, la email actual parece ser prueba@fundacionsantodomingo.org
    clean_and_generate("prueba@fundacionsantodomingo.org")

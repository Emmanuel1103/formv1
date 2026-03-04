import sys
import uuid
import random
from datetime import datetime, timedelta
from pathlib import Path

# Añadir el directorio app al sys.path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from db.cosmos_client import cosmos_db
from core.config import settings

def generate_mock_sessions(count=20):
    temas = [
        "Liderazgo Transformacional", "Gestión del Tiempo", "Excel Avanzado", 
        "Comunicación Asertiva", "Habilidades de Negociación", "Inteligencia Emocional",
        "Trabajo en Equipo", "Seguridad de la Información", "Protección de Datos",
        "Cultura Organizacional", "Ventas Consultivas", "Atención al Cliente",
        "Design Thinking", "Metodologías Ágiles", "Scrum Master Prep",
        "Python para Análisis de Datos", "Dashboarding con Power BI",
        "Salud Mental en el Trabajo", "Prevención de Riesgos", "Primeros Auxilios"
    ]
    
    facilitadores = [
        "Juan Pérez", "María Rodríguez", "Carlos Gómez", "Ana Martínez", 
        "Roberto Sánchez", "Lucía Fernández", "Diego López", "Elena Ramírez"
    ]
    
    responsables = [
        "Gerencia General", "Dirección de Talento Humano", "Área de Operaciones",
        "Relaciones Corporativas", "Innovación y Desarrollo", "Tecnología"
    ]
    
    cargos = [
        "Gerente de Proyecto", "Analista Senior", "Coordinador de Formación",
        "Líder Técnico", "Director de Área", "Especialista de Calidad"
    ]
    
    modalidades = ["Virtual", "Presencial", "Híbrida"]
    tipos_formacion = ["Interna", "Externa"]
    tipos_actividad = ["Inducción", "Formación"]
    
    email_creador = f"admin{settings.ALLOWED_DOMAIN}"
    
    # Limpiar datos previos del admin
    print(f"🧹 Limpiando sesiones previas de {email_creador}...")
    if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
        sesiones_previas = cosmos_db.listar_sesiones(owner_email=email_creador)
        for s in sesiones_previas:
            cosmos_db.eliminar_asistentes_por_sesion(s['id'])
            cosmos_db.eliminar_sesion(s['id'])
    
    print(f"🚀 Iniciando generación de {count} sesiones ficticias...")
    
    exitos = 0
    for i in range(count):
        tema = temas[i % len(temas)]
        # Fechas en los últimos 6 meses
        dias_atras = random.randint(1, 180)
        fecha_obj = datetime.now() - timedelta(days=dias_atras)
        fecha_str = fecha_obj.strftime("%Y-%m-%d")
        
        # Horas
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
            "contenido": f"Contenido detallado para la capacitación sobre {tema}. Cubriremos los puntos clave y objetivos estratégicos.",
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "tipo_formacion": random.choice(tipos_formacion),
            "modalidad": random.choice(modalidades),
            "tipo_actividad": random.choice(tipos_actividad),
            "created_by": email_creador,
            "created_at": now,
            "updated_at": now
        }
        
        try:
            if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
                cosmos_db.crear_sesion(sesion)
            else:
                # Fallback manual para JSON si es necesario
                import json
                data_file = Path(__file__).parent.parent / "app" / "data" / "sesiones.json"
                if data_file.exists():
                    with open(data_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                else:
                    data = []
                data.append(sesion)
                with open(data_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
            
            # Generar asistentes para esta sesión (entre 5 y 15)
            num_asistentes = random.randint(5, 15)
            nombres_asistentes = [
                "Andrés Villalba", "Beatriz Pinzón", "Camilo Torres", "Daniela Restrepo",
                "Eduardo Santos", "Fabiola Castro", "Gabriel García", "Helena Troya",
                "Iván Duque", "Johana Bahamón", "Kevin Flórez", "Laura Acuña",
                "Mauricio Leal", "Natalia París", "Oscar Murillo", "Paula Andrea"
            ]
            unidades = ["Unidad 1", "Unidad 2", "Unidad 3", "Dirección Central", "Sede Norte"]
            
            for _ in range(num_asistentes):
                nombre_a = random.choice(nombres_asistentes)
                cedula_a = str(random.randint(10000000, 99999999))
                asistente = {
                    "id": str(uuid.uuid4()),
                    "sesion_id": sesion_id,
                    "token": token,
                    "cedula": cedula_a,
                    "nombre": nombre_a,
                    "cargo": random.choice(cargos),
                    "unidad": random.choice(unidades),
                    "correo": f"{nombre_a.lower().replace(' ', '.')}@example.com",
                    "firma_url": "https://via.placeholder.com/200x100?text=Firma+Ficticia",
                    "fecha_registro": (fecha_obj + timedelta(hours=random.randint(2, 4))).isoformat()
                }
                
                if settings.STORAGE_MODE == "cosmosdb" and cosmos_db:
                    cosmos_db.asistentes_container.create_item(body=asistente)
                else:
                    # Fallback JSON
                    asistentes_file = Path(__file__).parent.parent / "app" / "data" / "asistentes.json"
                    if asistentes_file.exists():
                        with open(asistentes_file, 'r', encoding='utf-8') as f:
                            a_data = json.load(f)
                    else:
                        a_data = []
                    a_data.append(asistente)
                    with open(asistentes_file, 'w', encoding='utf-8') as f:
                        json.dump(a_data, f, indent=2)
            
            exitos += 1
            print(f"✅ [{exitos}/{count}] Creada: {tema} ({fecha_str}) con {num_asistentes} asistentes.")
        except Exception as e:
            print(f"❌ Error al crear sesión o asistentes para {tema}: {e}")
            
    print(f"\n✨ Proceso finalizado. Total sesiones creadas: {exitos}")

if __name__ == "__main__":
    generate_mock_sessions(20)

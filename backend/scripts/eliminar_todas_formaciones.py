import sys
import time
from pathlib import Path

# Añadir el directorio app al sys.path para importar cosmos_client
sys.path.append(str(Path(__file__).parent.parent / "app"))

try:
    from db.cosmos_client import cosmos_db
    from core.config import settings
    from azure.cosmos import exceptions
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("Asegúrate de ejecutar el script desde la carpeta 'backend'.")
    sys.exit(1)

def eliminar_todo():
    if not cosmos_db:
        print("❌ No se pudo conectar a CosmosDB. Verifica tu .env")
        return

    print("⚠️  ¡ADVERTENCIA! Estás a punto de eliminar TODAS las formaciones y asistentes.")
    confirm = input("¿Estás seguro? (escribe 'ELIMINAR TODO' para confirmar): ")
    
    if confirm != "ELIMINAR TODO":
        print("❌ Operación cancelada.")
        return

    start_time = time.time()
    total_asistentes = 0
    total_sesiones = 0

    try:
        print("\n🔍 Buscando formaciones...")
        sesiones = cosmos_db.listar_sesiones()
        
        if not sesiones:
            print("ℹ️  No se encontraron formaciones para eliminar.")
            return

        print(f"🚀 Iniciando eliminación de {len(sesiones)} formaciones...")

        for s in sesiones:
            s_id = s['id']
            tema = s.get('tema', 'Sin tema')
            
            # 1. Eliminar asistentes (Borrado en cascada manual)
            try:
                # Buscar asistentes para esta sesión
                query = "SELECT * FROM c WHERE c.sesion_id = @sid"
                params = [{"name": "@sid", "value": s_id}]
                asistentes_sesion = list(cosmos_db.asistentes_container.query_items(
                    query=query, parameters=params, enable_cross_partition_query=True
                ))
                
                for a in asistentes_sesion:
                    cosmos_db.asistentes_container.delete_item(item=a['id'], partition_key=s_id)
                    total_asistentes += 1
                
                # 2. Eliminar la sesión
                cosmos_db.eliminar_sesion(s_id)
                total_sesiones += 1
                
                print(f"  ✅ Eliminada: {tema} ({len(asistentes_sesion)} asistentes)")
                
            except Exception as e:
                print(f"  ❌ Error eliminando {tema}: {e}")

        duration = time.time() - start_time
        print(f"\n✨ ¡Limpieza completada en {duration:.2f}s!")
        print(f"📊 Resumen: {total_sesiones} sesiones y {total_asistentes} asistentes eliminados.")

    except Exception as e:
        print(f"❌ Error general durante la limpieza: {e}")

if __name__ == "__main__":
    eliminar_todo()

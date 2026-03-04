"""
Script para eliminar todos los archivos antiguos de Azure Blob Storage.
Esto limpiará la estructura antigua para empezar de cero con la nueva estructura.

ADVERTENCIA: Esta acción es IRREVERSIBLE. Todos los archivos serán eliminados.
"""

from azure.storage.blob import BlobServiceClient
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener connection string del .env
connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')

if not connection_string:
    print("❌ Error: AZURE_STORAGE_CONNECTION_STRING no está configurado en .env")
    exit(1)

# Conectar a Azure
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
container_name = "formatoformaciones"

print("=" * 80)
print("🗑️  LIMPIEZA DE AZURE BLOB STORAGE")
print("=" * 80)
print(f"\nCuenta: {blob_service_client.account_name}")
print(f"Contenedor: {container_name}\n")

try:
    # Obtener el contenedor
    container_client = blob_service_client.get_container_client(container_name)
    
    # Listar todos los blobs
    blobs = list(container_client.list_blobs())
    
    if not blobs:
        print("✅ El contenedor ya está vacío.\n")
        exit(0)
    
    print(f"⚠️  Se encontraron {len(blobs)} archivos para eliminar:\n")
    
    # Mostrar archivos a eliminar
    for blob in blobs:
        print(f"  📄 {blob.name}")
    
    print("\n" + "=" * 80)
    print("⚠️  ADVERTENCIA: Esta acción es IRREVERSIBLE")
    print("=" * 80)
    
    # Pedir confirmación
    confirmacion = input("\n¿Estás seguro de que quieres eliminar TODOS estos archivos? (escribe 'SI' para confirmar): ")
    
    if confirmacion.strip().upper() != "SI":
        print("\n❌ Operación cancelada. No se eliminó ningún archivo.")
        exit(0)
    
    # Eliminar todos los blobs
    print("\n🗑️  Eliminando archivos...")
    deleted_count = 0
    
    for blob in blobs:
        try:
            blob_client = blob_service_client.get_blob_client(
                container=container_name,
                blob=blob.name
            )
            blob_client.delete_blob()
            deleted_count += 1
            print(f"  ✅ Eliminado: {blob.name}")
        except Exception as e:
            print(f"  ❌ Error eliminando {blob.name}: {str(e)}")
    
    print("\n" + "=" * 80)
    print(f"✅ Limpieza completada: {deleted_count} archivos eliminados")
    print("=" * 80)
    print("\nAhora puedes crear nuevas formaciones con la estructura reorganizada.")
    
except Exception as e:
    print(f"❌ Error al conectar con Azure Storage: {str(e)}")
    print("\nVerifica que:")
    print("  1. El AZURE_STORAGE_CONNECTION_STRING sea correcto")
    print("  2. Tengas conexión a internet")
    print("  3. El contenedor 'formatoformaciones' exista")

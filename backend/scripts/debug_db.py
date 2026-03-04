import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from db.cosmos_client import cosmos_db
from core.config import settings

def debug_db():
    print(f"Checking CosmosDB sessions...")
    # List all sessions regardless of owner
    query = "SELECT * FROM c"
    items = list(cosmos_db.sesiones_container.query_items(
        query=query,
        enable_cross_partition_query=True
    ))
    
    print(f"Total sessions found: {len(items)}")
    corrupted = []
    for item in items:
        # Check if it has the required fields for SesionResponse
        # Required: id, token, tema, fecha, tipo_actividad, facilitador, contenido, hora_inicio, hora_fin, link, token_expiry, token_active, created_at, updated_at
        required = ['token', 'tema', 'fecha', 'tipo_actividad', 'facilitador']
        missing = [f for f in required if f not in item]
        if missing:
            corrupted.append((item.get('id'), missing, item))
    
    if corrupted:
        print(f"❌ Found {len(corrupted)} corrupted sessions!")
        for rid, m, full in corrupted:
            print(f"ID: {rid} | Missing: {m} | All keys: {list(full.keys())}")
    else:
        print("✅ No corrupted sessions found in the first layer.")

if __name__ == "__main__":
    debug_db()

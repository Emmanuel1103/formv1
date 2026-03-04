import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from db.cosmos_client import cosmos_db

def list_users():
    print(f"Checking CosmosDB users...")
    items = list(cosmos_db.usuarios_container.query_items(
        query="SELECT * FROM c",
        enable_cross_partition_query=True
    ))
    print(f"Total users found: {len(items)}")
    for item in items:
        # We need the email, but the 'usuarios' container seems to use 'id' as OID
        # Let's see what fields it has
        print(f"ID: {item.get('id')} | Nombre: {item.get('nombre')} | Email: {item.get('email', 'N/A')}")
        # Note: In auth.py registrar_o_actualizar_usuario is called with user_id and name.
        # It doesn't seem to store the email in the 'usuarios' container? Wait.

if __name__ == "__main__":
    list_users()

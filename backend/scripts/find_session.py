import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from db.cosmos_client import cosmos_db

def find_session(search_id):
    print(f"Searching for session {search_id}...")
    try:
        item = cosmos_db.obtener_sesion(search_id)
        if item:
            print(f"Found! Keys: {list(item.keys())}")
            print(f"Content: {item}")
        else:
            print("Not found in sesiones container.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_session("6b05f9c2-3d9c-46c0-b4b0-6428eb88f615") # Full ID from previous logs if possible, else partial
    # Wait, the log had '6b05f9c2-3d9c-46c0-b4b0-6428eb88f615'? 
    # Let me guess the last part or search by prefix
    print("\nPrefix search:")
    items = list(cosmos_db.sesiones_container.query_items(
        query="SELECT * FROM c WHERE STARTSWITH(c.id, '6b05f9c2')",
        enable_cross_partition_query=True
    ))
    for it in items:
        print(f"ID: {it.get('id')} | Keys: {list(it.keys())}")

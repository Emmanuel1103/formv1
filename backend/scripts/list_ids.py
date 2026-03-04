import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "app"))

from db.cosmos_client import cosmos_db

def list_all_ids():
    print(f"Listing all session IDs...")
    items = list(cosmos_db.sesiones_container.query_items(
        query="SELECT c.id, c.created_by FROM c",
        enable_cross_partition_query=True
    ))
    for item in items:
        print(f"ID: {item.get('id')} | Owner: {item.get('created_by')}")

if __name__ == "__main__":
    list_all_ids()

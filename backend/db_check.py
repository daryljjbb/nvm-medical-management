import os
import psycopg2
from dotenv import load_dotenv

# Load the variables from the .env file
load_dotenv()

def test_connection():
    db_url = os.getenv("DATABASE_URL")
    
    print("--- [DB TEST] Attempting to connect to Render PostgreSQL ---")
    print(f"URL found: {db_url[:20]}... (hidden for safety)")

    try:
        # Attempt to establish connection
        conn = psycopg2.connect(db_url)
        
        # Create a cursor to perform database operations
        cur = conn.cursor()
        
        # Execute a simple query
        cur.execute('SELECT version();')
        db_version = cur.fetchone()
        
        print("\n[SUCCESS] Connection established!")
        print(f"[VERSION] {db_version}")
        
        # Close connection
        cur.close()
        conn.close()
        print("\n--- [DB TEST] Connection closed cleanly ---")

    except Exception as e:
        print("\n[ERROR] Could not connect to the database!")
        print(f"[REASON]: {str(e)}")
        print("\n[FIX]: Ensure your Linux IP is allowed in Render's 'Access Control' settings.")

if __name__ == "__main__":
    test_connection()

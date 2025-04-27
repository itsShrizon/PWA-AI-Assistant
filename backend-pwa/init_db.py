"""
Initialize the database tables
"""
from app.db.database import Base, engine
from app.config import DATABASE_URL

def init_db():
    print(f"Initializing database at {DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

if __name__ == "__main__":
    init_db()

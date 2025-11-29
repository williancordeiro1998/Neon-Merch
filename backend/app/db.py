from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./neon_merch.db")

# check_same_thread é necessário apenas para SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

# Dependency Injection para rotas
def get_session():
    with Session(engine) as session:
        yield session
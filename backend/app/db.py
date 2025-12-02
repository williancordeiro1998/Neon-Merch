from sqlmodel import SQLModel, create_engine, Session
import os

# Se estiver na Vercel, usa a pasta temporária /tmp (que permite escrita)
# Se estiver no seu PC, usa a pasta local normal
if os.getenv("VERCEL"):
    DATABASE_URL = "sqlite:////tmp/neon_merch.db"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./neon_merch.db")

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Enum, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import enum

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tasks.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class Category(str, enum.Enum):
    work = "work"
    personal = "personal"
    idea = "idea"
    reminder = "reminder"
    shopping = "shopping"
    health = "health"
    finance = "finance"
    other = "other"


class Status(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    done = "done"
    cancelled = "cancelled"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default=Status.open)
    priority = Column(String(10), default=Priority.medium)
    category = Column(String(20), default=Category.other)
    source = Column(String(50), default="web")  # web / telegram / whatsapp
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    tags = Column(String(500), nullable=True)  # comma-separated
    ai_summary = Column(Text, nullable=True)
    reminded_at = Column(DateTime, nullable=True)


class Subscription(Base):
    """Telegram chat IDs subscribed to daily digest and reminders."""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String(50), unique=True, nullable=False)
    daily_digest = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    # Add columns for users upgrading from older schema
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE tasks ADD COLUMN reminded_at DATETIME",
            "ALTER TABLE tasks ADD COLUMN due_date DATETIME",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # Column already exists

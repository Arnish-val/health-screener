"""
Database engine configuration.

Supports both SQLite (local development) and PostgreSQL (production).
Set the DATABASE_URL environment variable to switch:

  Local (default):    sqlite:///./health_screener.db
  Production:         postgresql://user:password@host/dbname

The engine is created dynamically so that tests can override
the database URL via the DATABASE_URL env var or conftest fixtures.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Database URL ─────────────────────────────────────────────────────────────
# Reads DATABASE_URL from the environment (set in .env or Render env vars).
# Falls back to SQLite for local development.
DATABASE_URL: str = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./health_screener.db",
)

# Render's PostgreSQL free-tier sometimes hands back a "postgres://" URL
# (legacy scheme). SQLAlchemy 1.4+ requires "postgresql://" — fix it silently.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ── Engine ────────────────────────────────────────────────────────────────────
_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    # SQLite needs this so the same connection can be used across threads.
    # PostgreSQL drivers are thread-safe by default — omit the arg there.
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # Connection pool: keep a small pool alive in production.
    pool_pre_ping=True,          # detect stale connections automatically
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

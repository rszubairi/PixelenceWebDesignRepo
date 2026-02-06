"""
Database session management
"""
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

# SQLAlchemy engine
engine = None
async_session_maker = None


async def init_db():
    """Initialize database connection"""
    global engine, async_session_maker

    try:
        # Create async engine
        engine = create_async_engine(
            settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
            echo=False,
            future=True,
        )

        # Create session maker
        async_session_maker = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        logger.info("Database connection initialized")

    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        # For development, continue without database
        logger.warning("Running without database - using in-memory storage")


async def get_db() -> AsyncSession:
    """Get database session"""
    if async_session_maker is None:
        raise RuntimeError("Database not initialized")

    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def close_db():
    """Close database connections"""
    if engine:
        await engine.dispose()
        logger.info("Database connections closed")

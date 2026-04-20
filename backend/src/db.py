import os
import ssl
import logging
from typing import Optional

import asyncpg

logger = logging.getLogger(__name__)

# Global connection pool instance
_pool: Optional[asyncpg.Pool] = None

async def init_db() -> None:
    """
    Initializes the asyncpg connection pool.
    Must be called on FastAPI startup event.
    """
    global _pool
    db_url = os.environ.get("DATABASE_URL")
    
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is missing")
    
    # Configure strict SSL for Supabase compatibility (sslmode=require)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE  

    try:
        # Create connection pool optimized for concurrency
        _pool = await asyncpg.create_pool(
            dsn=db_url,
            ssl=ssl_context,
            min_size=2,   # Maintain a base number of connections to minimize cold starts
            max_size=20,  # Cap connections to prevent DB exhaustion under load
            command_timeout=30.0,
            server_settings={
                'application_name': 'SecureLLM_API'
            }
        )
        logger.info("Database connection pool initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database pool: {e}")
        raise

async def get_pool() -> asyncpg.Pool:
    """Retrieves the active global database connection pool."""
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Did you call init_db()?")
    return _pool

async def close_db() -> None:
    """Closes the connection pool gracefully. Call on FastAPI shutdown."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed.")

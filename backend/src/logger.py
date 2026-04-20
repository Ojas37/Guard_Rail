import asyncio
import json
import logging
from typing import Any

from .db import get_pool 

logger = logging.getLogger(__name__)

# Configurable constants
BATCH_SIZE = 50
BATCH_TIMEOUT_SEC = 5.0
MAX_RETRIES = 3

class GuardrailLogger:
    """
    Async logging system with batching and background workers 
    for sub-100ms API impact.
    """
    def __init__(self):
        # maxsize prevents memory leaks if DB goes completely down
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=10000) 
        self.worker_task: asyncio.Task | None = None
        self._shutdown_event = asyncio.Event()

    async def start(self) -> None:
        """Starts the background batch processor."""
        if self.worker_task is None:
            self._shutdown_event.clear()
            self.worker_task = asyncio.create_task(self._process_queue())
            logger.info("Async Guardrail worker started.")

    async def stop(self) -> None:
        """Triggers graceful shutdown and waits for logs to flush into Postgres."""
        if self.worker_task is not None:
            logger.info("Initiating graceful shutdown for Guardrail Logger...")
            self._shutdown_event.set()
            await self.worker_task
            self.worker_task = None
            logger.info("Guardrail Logger stopped cleanly.")

    async def log_guardrail_event(self, data: dict[str, Any]) -> None:
        """
        Non-blocking insert into the logging queue.
        Call this directly from the API endpoint without await overhead.
        """
        try:
            self.queue.put_nowait(data)
        except asyncio.QueueFull:
            logger.error("Logging queue is full! Dropping log to preserve API latency...")
            # Optional in prod: fallback to stdout so log aggregation picks it up

    async def _process_queue(self) -> None:
        """Background coroutine that loops, batches, and initiates inserts."""
        batch: list[dict[str, Any]] = []
        
        while not self._shutdown_event.is_set() or not self.queue.empty():
            try:
                # Wait for next log, up to the batch timeout limit
                item = await asyncio.wait_for(self.queue.get(), timeout=BATCH_TIMEOUT_SEC)
                batch.append(item)
                self.queue.task_done()
            except asyncio.TimeoutError:
                pass # Timeout triggered flush logic
            except asyncio.CancelledError:
                logger.warning("Worker task cancelled unexpectedly.")
                break

            # Trigger DB insert if batch limit hit OR shutting down with remaining cache
            if len(batch) >= BATCH_SIZE or (self._shutdown_event.is_set() and batch):
                await self._insert_batch(batch)
                batch.clear()

        # Final safety flush boundary
        if batch:
            await self._insert_batch(batch)

    async def _insert_batch(self, batch: list[dict[str, Any]]) -> None:
        """Executes a PostgreSQL executemany insert with exponential backoff retries."""
        if not batch:
            return

        query = """
            INSERT INTO guardrail_logs (
                api_key_id, template, direction, action, risk_score, violations, latency_ms
            ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        """
        
        # Prepare batch format for asyncpg
        try:
             records = [
                 (
                     record.get("api_key_id"),
                     record.get("template"),
                     record.get("direction"),
                     record.get("action"),
                     record.get("risk_score"),
                     # Serializing list to string so pg parses it explicitly into '::jsonb'
                     json.dumps(record.get("violations", [])), 
                     record.get("latency_ms")
                 ) for record in batch
             ]
        except Exception as e:
            logger.error(f"Error formulating batch records for DB: {e}")
            return

        retries = 0
        while retries <= MAX_RETRIES:
            try:
                pool = await get_pool()
                async with pool.acquire() as conn:
                    # executemany natively translates to fast UNNEST() arrays in db operations
                    await conn.executemany(query, records)
                
                logger.debug(f"Successfully inserted {len(records)} guardrail logs.")
                return # Exit retry loop on success
            
            except Exception as e:
                retries += 1
                wait_time = 2 ** retries # Exponential Backoff: 2s, 4s, 8s, 16s
                logger.error(f"Failed to insert logs (attempt {retries}/{MAX_RETRIES}): {e}")
                
                if retries <= MAX_RETRIES:
                    await asyncio.sleep(wait_time)
                else:
                    logger.critical(f"Dropping {len(records)} logs after {MAX_RETRIES} retries.")

# Instantiate global singleton
guardrail_logger = GuardrailLogger()

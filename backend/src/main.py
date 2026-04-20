import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .db import init_db, close_db
from .logger import guardrail_logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ==========================
    # STARTUP
    # ==========================
    await init_db()
    # Start the background batch queue before routing starts
    await guardrail_logger.start() 
    
    yield # API serves traffic
    
    # ==========================
    # SHUTDOWN
    # ==========================
    # Flushes remaining events that haven't hit the 50 item / 5 sec rule yet
    await guardrail_logger.stop() 
    await close_db()

app = FastAPI(
    title="AegisGuard / SecureLLM API",
    description="Guardrails-as-a-Service Core API",
    version="1.0.0",
    lifespan=lifespan
)

# Import and include the Audit Router
from .audit import router as audit_router
app.include_router(audit_router, tags=["Audit Logs Search"])

@app.post("/v1/guard")
async def process_guard():
    # ... Evaluate text with HuggingFace, presidio, cross-encoder, etc. ...
    
    log_payload = {
        "api_key_id": "c9a48f76-80f4-4d89-9aeb-7b7cf7a82b01", # Assume pulled from auth token
        "template": "healthcare",
        "direction": "input",
        "action": "block",
        "risk_score": 0.82,
        "violations": [{"type": "pii", "confidence": 0.9}],
        "latency_ms": 45.2 # the delta time measured prior
    }
    
    # Fire and Forget - Queues log payload but doesn't block CPU thread
    await guardrail_logger.log_guardrail_event(log_payload)
    
    return {"status": "blocked", "score": 0.82}

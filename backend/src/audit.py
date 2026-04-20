import json
import logging
from datetime import datetime
from typing import Any, List, Literal, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, UUID4

from .db import get_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/audit", tags=["Audit"])

# ==========================================
# 1. Pydantic Request Model
# ==========================================
class AuditSearchRequest(BaseModel):
    template: Optional[str] = Field(None, description="Filter by template name (e.g., healthcare, finance)")
    action: Optional[str] = Field(None, description="Filter by action (e.g., allow, warn, block)")
    start_date: Optional[datetime] = Field(None, description="Start date for filtering logs")
    end_date: Optional[datetime] = Field(None, description="End date for filtering logs")
    
    # Bonus filtering
    min_risk_score: Optional[float] = Field(None, ge=0.0, description="Minimum risk score value")
    max_risk_score: Optional[float] = Field(None, ge=0.0, description="Maximum risk score value")
    api_key_id: Optional[UUID4] = Field(None, description="Filter by a specific API Key")
    
    # Pagination & Sorting
    limit: int = Field(50, ge=1, le=100, description="Items per page (max 100)")
    offset: int = Field(0, ge=0, description="Pagination offset")
    sort_by: Literal["created_at", "risk_score", "latency_ms"] = Field("created_at", description="Field to sort results by")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order")


# Optional: Response models for structure safety
class AuditLogEntry(BaseModel):
    id: int
    api_key_id: Optional[UUID4]
    template: str
    direction: str
    action: str
    risk_score: float
    violations: Any
    latency_ms: float
    created_at: datetime

class AuditSearchResponse(BaseModel):
    total: int
    results: List[AuditLogEntry]


# ==========================================
# 2. FastAPI Endpoint Implementation
# ==========================================
@router.post("/search", response_model=AuditSearchResponse)
async def search_audit_logs(
    request: AuditSearchRequest,
    pool: asyncpg.Pool = Depends(get_pool)
):
    try:
        # Base SQL statements
        # We use 'WHERE 1=1' as a clean approach to append 'AND' conditions dynamically.
        base_query = "SELECT * FROM guardrail_logs WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM guardrail_logs WHERE 1=1"
        
        conditions = []
        params = []
        param_idx = 1
        
        # ==========================================
        # 3. SQL Query Building Logic (Safe & Dynamic)
        # ==========================================
        # Add conditions strictly using parameterized bindings to prevent SQL Injection.
        
        if request.template:
            conditions.append(f"template = ${param_idx}")
            params.append(request.template)
            param_idx += 1
            
        if request.action:
            conditions.append(f"action = ${param_idx}")
            params.append(request.action)
            param_idx += 1
            
        if request.start_date:
            conditions.append(f"created_at >= ${param_idx}")
            params.append(request.start_date)
            param_idx += 1
            
        if request.end_date:
            conditions.append(f"created_at <= ${param_idx}")
            params.append(request.end_date)
            param_idx += 1
            
        if request.min_risk_score is not None:
            conditions.append(f"risk_score >= ${param_idx}")
            params.append(request.min_risk_score)
            param_idx += 1
            
        if request.max_risk_score is not None:
            conditions.append(f"risk_score <= ${param_idx}")
            params.append(request.max_risk_score)
            param_idx += 1
            
        if request.api_key_id:
            conditions.append(f"api_key_id = ${param_idx}")
            params.append(request.api_key_id)
            param_idx += 1
            
        # Assemble WHERE clause
        if conditions:
            condition_str = " AND " + " AND ".join(conditions)
            base_query += condition_str
            count_query += condition_str
            
        # Assembly sorting (Safe! Only Literals allowed by Pydantic)
        base_query += f" ORDER BY {request.sort_by} {request.sort_order.upper()}"
        
        # Pagination
        base_query += f" LIMIT ${param_idx} OFFSET ${param_idx + 1}"
        
        # We need two copies of 'params': one for the COUNT without LIMIT/OFFSET,
        # and one for the overall retrieval.
        count_params = list(params)
        
        # Add Limit and Offset for exact retrieval
        params.extend([request.limit, request.offset])

        # Execute Queries safely using the connection pool
        async with pool.acquire() as conn:
            # 1. Fetch Total Count for this active filter condition
            total_count = await conn.fetchval(count_query, *count_params)
            
            # Optimized return: skip full query if count is 0
            if total_count == 0:
                return AuditSearchResponse(total=0, results=[])
                
            # 2. Fetch the filtered actual rows
            rows = await conn.fetch(base_query, *params)
            
            # Map database records to dictionaries
            results = [dict(row) for row in rows]
            
            # asyncpg returns JSONB as a string. Parse into dict for API serialization if it exists.
            for row in results:
                if isinstance(row.get('violations'), str):
                    try:
                        row['violations'] = json.loads(row['violations'])
                    except json.JSONDecodeError:
                        pass
                        
            return AuditSearchResponse(total=total_count, results=results)

    except asyncpg.PostgresError as db_err:
        logger.error(f"Database error executing search query: {db_err}")
        raise HTTPException(status_code=500, detail="Database operation failed")
    except Exception as e:
        logger.error(f"Unexpected API error during audit search: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during audit search")

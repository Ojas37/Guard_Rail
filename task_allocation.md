# 📋 MVP DEVELOPMENT TASK BREAKDOWN
## **5-Team Member Distribution for AegisGuard API**

---

## **TEAMMATE 1: Core API Infrastructure & Request Handling**

### **Responsibilities:**
- FastAPI application setup and configuration
- Main `/v1/guard` endpoint implementation
- Pydantic request/response schemas
- Health check and metrics endpoints
- CORS and basic middleware

### **Specific Tasks:**
```python
# 1.1 Create FastAPI app structure
- main.py with FastAPI initialization
- Configure middleware stack (CORS, timing)
- Set up logging with loguru

# 1.2 Implement Pydantic schemas
- GuardRequest model (text, template, direction, metadata)
- GuardResponse model (allowed, risk_score, action, violations, etc.)
- Validation rules (max_length=4096, literals)

# 1.3 Build core endpoint
- POST /v1/guard skeleton
- Request validation
- Response serialization
- Error handling (422, 500)

# 1.4 Utility endpoints
- GET /v1/health (liveness/readiness)
- GET /v1/metrics (Prometheus format stub)
```

### **Deliverables:**
- ✅ Working FastAPI app with `/v1/guard` endpoint
- ✅ Request/Response validation
- ✅ Health check returning 200 OK
- ✅ OpenAPI docs at `/docs`

### **Integration Points:**
- **Receives from:** Teammate 2 (auth middleware), Teammate 4 (guardrail engine)
- **Sends to:** Teammate 5 (database logging), Teammate 2 (rate limiting)

### **Dependencies:**
```python
fastapi==0.109.0
uvicorn==0.27.0
gunicorn==22.0.0
pydantic==2.5.0
loguru==0.7.0
```

---

## **TEAMMATE 2: Authentication, Rate Limiting & Redis Integration**

### **Responsibilities:**
- API key generation and validation
- Redis connection and caching
- Rate limiting middleware (token bucket)
- API key rotation endpoint
- Usage tracking

### **Specific Tasks:**
```python
# 2.1 Redis setup
- Redis connection pool (Upstash free tier)
- Connection retry logic with exponential backoff
- Health check for Redis connectivity

# 2.2 API key management
- POST /v1/keys/generate (create new key)
- POST /v1/keys/rotate (rotate existing key)
- GET /v1/usage (return usage stats per key)
- Hash keys with bcrypt before storage

# 2.3 Rate limiting middleware
- Integrate slowapi with Redis backend
- Token bucket algorithm (capacity=100, refill_rate=10/min)
- Return 429 with Retry-After header
- Per-key rate limit configuration

# 2.4 Auth middleware
- Extract X-AEGIS-KEY header
- Validate against Redis cache
- Cache miss → PostgreSQL fallback
- Attach tenant_id to request state
```

### **Deliverables:**
- ✅ Redis connection working
- ✅ API key validation middleware
- ✅ Rate limiting (100 req/min default)
- ✅ 429 responses with proper headers

### **Integration Points:**
- **Receives from:** Teammate 1 (request context)
- **Sends to:** Teammate 1 (middleware), Teammate 5 (usage logs)

### **Dependencies:**
```python
redis==5.0.0
slowapi==0.1.9
bcrypt==4.1.0
python-dotenv==1.0.0
```

### **Environment Variables:**
```bash
REDIS_URL=redis://upstash-url
API_KEY_SECRET=your-secret-key
```

---

## **TEAMMATE 3: ML Model Integration & Guardrail Execution**

### **Responsibilities:**
- Load and cache ML models (ONNX format)
- Implement PII detection (Presidio)
- Implement toxicity classifier
- Implement prompt injection detector
- Async inference wrapper with circuit breaker

### **Specific Tasks:**
```python
# 3.1 Model loading singleton
- Load unitary/toxic-bert (toxicity)
- Load cross-encoder/nli-deberta-v3-base (injection)
- Convert to ONNX via optimum.exporters
- Warm-up inference on startup
- Cache models in memory

# 3.2 Presidio integration
- Initialize Presidio analyzer
- Configure PII recognizers (SSN, credit card, email, phone)
- Healthcare-specific: MRN, ICD-10, prescription patterns
- Finance-specific: IBAN, routing numbers, account IDs

# 3.3 Async inference wrapper
- async def detect_toxicity(text) → float
- async def detect_injection(prompt) → float
- Circuit breaker (timeout=400ms)
- Fallback to rule-only mode on failure

# 3.4 Model optimization
- ONNX runtime with CPUExecutionProvider
- Set IntraOpNumThreads=1
- Batch size=1 inference
- Quantization (INT8) if needed
```

### **Deliverables:**
- ✅ Models loaded and cached at startup
- ✅ PII detection working (Presidio)
- ✅ Toxicity classifier returning confidence scores
- ✅ Prompt injection detector working
- ✅ Inference latency <50ms per model

### **Integration Points:**
- **Receives from:** Teammate 4 (text input, template config)
- **Sends to:** Teammate 4 (detection results, confidence scores)

### **Dependencies:**
```python
transformers==4.38.0
onnxruntime==1.17.0
optimum==1.16.0
presidio-analyzer==2.2.0
presidio-anonymizer==2.2.0
spacy==3.7.0
sentence-transformers==2.3.0
```

### **Model Download Script:**
```python
# download_models.py
from transformers import pipeline
import optimum

# Download and convert to ONNX
toxicity_pipe = pipeline("text-classification", model="unitary/toxic-bert")
injection_model = AutoModelForSequenceClassification.from_pretrained(
    "cross-encoder/nli-deberta-v3-base"
)
```

---

## **TEAMMATE 4: Template System, Scoring Engine & Redaction**

### **Responsibilities:**
- Template router (JSON config loader)
- Healthcare template (HIPAA rules)
- Finance template (PCI-DSS rules)
- Weighted scoring aggregation
- Text redaction engine
- Guardrail orchestration

### **Specific Tasks:**
```python
# 4.1 Template router
- LRU cache (cachetools.TTLCache) for configs
- Load JSON templates from /templates/
- Hot-reload on file change
- Validate schema on load

# 4.2 Create template configs
templates/healthcare.json:
{
  "name": "healthcare",
  "guardrails": {
    "pii": {"enabled": true, "weight": 0.4, "threshold": 0.7},
    "toxicity": {"enabled": true, "weight": 0.3, "threshold": 0.6},
    "injection": {"enabled": true, "weight": 0.3, "threshold": 0.65}
  },
  "block_threshold": 0.7,
  "warn_threshold": 0.4,
  "phi_patterns": ["MRN", "ICD-10", "prescription"]
}

templates/finance.json:
{
  "name": "finance",
  "guardrails": {
    "pii": {"enabled": true, "weight": 0.5, "threshold": 0.75},
    "toxicity": {"enabled": true, "weight": 0.2, "threshold": 0.6},
    "injection": {"enabled": true, "weight": 0.3, "threshold": 0.7}
  },
  "block_threshold": 0.75,
  "pci_patterns": ["credit_card", "iban", "routing_number"]
}

# 4.3 Scoring aggregation
async def aggregate_results(results: dict, template: dict) -> GuardResponse:
    - Compute weighted risk score
    - Apply template-specific thresholds
    - Determine action (allow/warn/block)
    - Build violations list

# 4.4 Redaction engine
- Replace PII with *** or [REDACTED]
- Preserve entity type in metadata
- Return redacted_text in response

# 4.5 Guardrail orchestration
async def run_guardrails(text: str, template: str) -> GuardResponse:
    - Load template config
    - Spawn asyncio.gather() for parallel execution
    - Call Teammate 3's model inference
    - Aggregate results
    - Apply redaction
    - Return GuardResponse
```

### **Deliverables:**
- ✅ Template router with LRU cache
- ✅ 2 working templates (healthcare, finance)
- ✅ Weighted scoring logic
- ✅ Text redaction working
- ✅ Parallel execution via asyncio.gather()

### **Integration Points:**
- **Receives from:** Teammate 1 (request data), Teammate 3 (model results)
- **Sends to:** Teammate 1 (final response), Teammate 5 (violation logs)

### **Dependencies:**
```python
cachetools==5.3.0
pydantic==2.5.0
```

---

## **TEAMMATE 5: Database, Logging, Monitoring & Dashboard**

### **Responsibilities:**
- PostgreSQL schema setup and migrations
- Async logging with asyncpg
- Prometheus metrics integration
- Streamlit dashboard
- Audit log query endpoint

### **Specific Tasks:**
```python
# 5.1 Database schema
- Run SQL migrations (tables from PRD Section 8)
- Create monthly partitions for guardrail_logs
- Set up indexes (B-tree, GIN)
- Configure PgBouncer connection pooling

# 5.2 Async logging
- asyncpg connection pool
- Batch insert (every 50 records or 5s)
- Structured logging with loguru
- No raw PII in logs

# 5.3 Prometheus metrics
- Integrate prometheus-fastapi-instrumentator
- Custom metrics:
  - guardrail_requests_total (counter)
  - guardrail_latency_seconds (histogram)
  - guardrail_violations_total (counter by type)
- Expose /metrics endpoint

# 5.4 Streamlit dashboard
- Real-time threat visualization (Plotly)
- Query guardrail_logs by template/action
- Display metrics (total requests, block rate, avg latency)
- Template management UI (view/edit JSON configs)
- Usage analytics per API key

# 5.5 Audit endpoint
- POST /v1/audit/search (paginated query)
- Filter by template, action, date range
- Return violations JSONB
```

### **Deliverables:**
- ✅ PostgreSQL tables created with partitions
- ✅ Async logging working (batch insert)
- ✅ Prometheus /metrics endpoint returning data
- ✅ Streamlit dashboard deployed
- ✅ Audit query endpoint functional

### **Integration Points:**
- **Receives from:** Teammate 1 (request/response data), Teammate 4 (violations)
- **Sends to:** Teammate 2 (usage stats), Dashboard consumers

### **Dependencies:**
```python
asyncpg==0.29.0
prometheus-fastapi-instrumentator==6.1.0
streamlit==1.30.0
plotly==5.18.0
psycopg2-binary==2.9.9
```

### **Database Migration Script:**
```sql
-- migrations/001_initial_schema.sql
CREATE TABLE api_keys (...);
CREATE TABLE guardrail_logs (...) PARTITION BY RANGE (created_at);
CREATE TABLE guardrail_logs_2024_11 PARTITION OF guardrail_logs
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
-- ... indexes
```

### **Streamlit Dashboard Skeleton:**
```python
# dashboard.py
import streamlit as st
import pandas as pd
import plotly.express as px
import asyncpg

st.title("AegisGuard Dashboard")

# Metrics
col1, col2, col3 = st.columns(3)
col1.metric("Total Requests", get_total_requests())
col2.metric("Block Rate", get_block_rate())
col3.metric("Avg Latency", get_avg_latency())

# Threat visualization
fig = px.bar(get_threats_by_template())
st.plotly_chart(fig)
```

---

## 🔄 **INTEGRATION STRATEGY**

### **Phase 1: Parallel Development (Days 1-3)**
Each teammate works independently on their module with mock/stub implementations for dependencies.

### **Phase 2: Integration Points (Day 4)**
```
1. Teammate 1 + Teammate 2: Auth middleware integration
2. Teammate 1 + Teammate 4: Guardrail engine wiring
3. Teammate 4 + Teammate 3: Model inference calls
4. Teammate 1 + Teammate 5: Logging integration
5. Teammate 5 + All: Dashboard data sources
```

### **Phase 3: End-to-End Testing (Day 5)**
- Full request flow: Client → Auth → Guardrails → DB → Response
- Load testing with Locust
- Latency validation (<100ms p95)

---

## 📦 **SHARED CONFIGURATION FILES**

### **requirements.txt (Root)**
```txt
fastapi==0.109.0
uvicorn==0.27.0
gunicorn==22.0.0
pydantic==2.5.0
loguru==0.7.0
redis==5.0.0
slowapi==0.1.9
bcrypt==4.1.0
transformers==4.38.0
onnxruntime==1.17.0
optimum==1.16.0
presidio-analyzer==2.2.0
spacy==3.7.0
cachetools==5.3.0
asyncpg==0.29.0
prometheus-fastapi-instrumentator==6.1.0
streamlit==1.30.0
plotly==5.18.0
python-dotenv==1.0.0
```

### **.env.example**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/aegisguard

# Redis
REDIS_URL=redis://localhost:6379

# Auth
API_KEY_SECRET=your-secret-key-min-32-chars

# Models
MODEL_CACHE_DIR=./models

# Deployment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## ✅ **COMBINATION CHECKLIST**

After each teammate completes their tasks, verify:

- [ ] **Teammate 1 → 2:** Auth middleware wraps `/v1/guard` without breaking request flow
- [ ] **Teammate 1 → 4:** Guardrail engine integrates as async function call
- [ ] **Teammate 4 → 3:** Model inference returns consistent dict format
- [ ] **Teammate 4 → 5:** Violations JSON matches database schema
- [ ] **Teammate 2 → 5:** Usage stats logged to PostgreSQL
- [ ] **Teammate 5 → All:** Dashboard displays data from all modules

---

## 🎯 **SUCCESS CRITERIA**

**After integration, the system must:**
1. Accept `POST /v1/guard` with valid API key
2. Execute 3 guardrails in parallel (PII, toxicity, injection)
3. Apply template-specific thresholds (healthcare/finance)
4. Return response with `allowed`, `risk_score`, `violations`, `redacted_text`
5. Log to PostgreSQL asynchronously
6. Expose Prometheus metrics at `/metrics`
7. Achieve <100ms p95 latency at 100 RPS
8. Display real-time data in Streamlit dashboard

---

This breakdown ensures **zero overlap**, **clear ownership**, and **seamless integration**. Each teammate can work independently with well-defined interfaces. Good luck! 🚀
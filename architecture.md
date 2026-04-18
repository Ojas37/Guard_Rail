# 📂 PRODUCTION VS CODE STRUCTURE (Strict Frontend/Backend Separation)

This structure enforces **complete independence** between the API engine and the dashboard while maintaining a unified repository for version control, CI/CD, and deployment. Each side has its own dependency files, test suites, and deployment configs, matching your PRD's zero-Docker, platform-native requirement.

```text
AegisGuard/
├── 📄 README.md                      # Project overview, architecture, setup guide
├── 📄 .env.example                   # Shared env template (DB, Redis, Secrets)
├── 📄 ruff.toml                      # Global linting config
├── 📄 pytest.ini                     # Global test config
├──  render.yaml                    # Render deployment manifest (API + Dashboard)
├──  railway.json                  # Railway alternative deployment config
│
├── 📂 backend/                       # 🧠 CORE API & ML ENGINE (Teammates 1-4 + T5 DB)
│   ├── 📄 requirements.txt           # FastAPI, ONNX, Presidio, asyncpg, redis, slowapi
│   ├── 📄 Procfile                   # gunicorn -k uvicorn.workers.UvicornWorker src.main:app
│   │
│   ├── 📂 src/
│   │   ├── 📄 main.py                # 👤 T1: FastAPI app, lifespan, middleware stack
│   │   │
│   │   ├── 📂 api/                   # 👤 T1: Routing & Validation
│   │   │   ├── 📂 routes/
│   │   │   │   ├── 📄 guard.py       # POST /v1/guard
│   │   │   │   ├── 📄 audit.py       # POST /v1/audit/search
│   │   │   │   └── 📄 health.py      # GET /v1/health, /metrics
│   │   │   └── 📂 schemas/
│   │   │       ├── 📄 request.py     # GuardRequest Pydantic model
│   │   │       └──  response.py    # GuardResponse Pydantic model
│   │   │
│   │   ├── 📂 auth/                  # 👤 T2: Auth & Rate Limiting
│   │   │   ├── 📄 middleware.py      # API key validation + SlowAPI rate limiter
│   │   │   ├── 📄 keys.py            # Key generation, rotation, bcrypt hashing
│   │   │   └── 📄 usage.py           # Token bucket logic & usage tracking
│   │   │
│   │   ├── 📂 services/              # 👤 T3 & T4: Engine & ML
│   │   │   ├── 📄 engine.py          # T4: asyncio.gather orchestration & aggregator
│   │   │   ├── 📄 redactor.py        # T4: PII/PHI/PCI replacement logic
│   │   │   ├── 📂 templates/         # T4: Industry configs & router
│   │   │   │   ├── 📄 router.py      # LRU cache + hot-reload logic
│   │   │   │   ├── 📄 healthcare.json # HIPAA rules & thresholds
│   │   │   │   └──  finance.json    # PCI-DSS rules & thresholds
│   │   │   └── 📂 detectors/         # T3: ML Inference Wrappers
│   │   │       ├── 📄 pii.py         # Presidio analyzer wrapper
│   │   │       ├── 📄 toxicity.py    # ONNX toxicity inference
│   │   │       └── 📄 injection.py   # Cross-encoder injection inference
│   │   │
│   │   ├── 📂 db/                    # 👤 T5: Database & Async Logging
│   │   │   ├── 📄 connection.py      # asyncpg pool setup
│   │   │   ├── 📄 audit_logger.py    # Batch insert & memory queue
│   │   │   └── 📂 migrations/
│   │   │       └── 📄 001_init.sql   # PRD Section 8 schema + partitions
│   │   │
│   │   └── 📂 core/                  # 👤 T1 & T2: Config & Utilities
│   │       ├── 📄 config.py          # Settings loader (env vars, paths)
│   │       ├── 📄 logging.py         # Loguru structured logging
│   │       └── 📄 security.py        # Cryptographic utils, CORS, headers
│   │
│   ├── 📂 models/                    # 🤖 ML Binaries (Gitignored)
│   │   ├── 📂 onnx/                  # toxicity.onnx, injection.onnx
│   │   └──  spacy/                 # en_core_web_sm
│   │
│   └── 📂 tests/                     # 🧪 Backend QA
│       ├── 📂 unit/                  # Mocked DB/Redis tests
│       ├── 📂 integration/           # Full pipeline + ONNX inference tests
│       ├── 📂 load/                  # Locust scripts
│       └──  conftest.py            # Pytest fixtures & app client
│
├──  frontend/                      # 🖥️ DASHBOARD (Streamlit) - 👤 Teammate 5
│   ├── 📄 requirements.txt           # streamlit, plotly, pandas, httpx
│   ├── 📄 .streamlit/
│   │   └── 📄 config.toml            # Streamlit theme & server config
│   │
│   ├── 📂 app/
│   │   ├── 📄 main.py                # Entry point, auth flow, sidebar
│   │   ├── 📂 pages/
│   │   │   ├── 📄 1_analytics.py     # Real-time metrics & Plotly charts
│   │   │   └── 📄 2_audit_logs.py    # Paginated violation table
│   │   └──  components/
│   │       ├── 📄 metrics_cards.py   # Reusable KPI widgets
│   │       └── 📄 charts.py          # Chart rendering functions
│   │
│   └──  tests/                     # Frontend/UI QA
│       └── 📄 test_dashboard.py      # Streamlit test runner (pytest + streamlit.testing)
│
├── 📂 .github/
│   └── 📂 workflows/
│       ├── 📄 backend-ci.yml         # Lint → Test → Build ONNX cache
│       ├── 📄 frontend-ci.yml        # Lint → UI Test
│       └── 📄 deploy.yml             # Trigger Render/Railway deploy on main
│
└── 📂 scripts/                       # 🛠️ DevOps & Setup
    ├── 📄 download_models.py         # Fetches HF models → converts to ONNX
    ├── 📄 setup_env.sh               # Local env init, venv creation
    └── 📄 seed_db.sql                # Initial API keys & test data
```

---

## 🔑 **TEAMMATE OWNERSHIP MAP**

| Teammate | Primary Directory | Key Files | Deliverable |
|----------|-------------------|-----------|-------------|
| **T1** | `backend/src/api/`, `backend/src/main.py` | `routes/guard.py`, `schemas/`, `main.py` | FastAPI skeleton, validation, middleware wiring |
| **T2** | `backend/src/auth/`, `backend/src/core/` | `middleware.py`, `keys.py`, `config.py` | API key auth, Redis rate limiting, env loading |
| **T3** | `backend/src/services/detectors/` | `pii.py`, `toxicity.py`, `injection.py` | ONNX inference wrappers, Presidio integration |
| **T4** | `backend/src/services/` | `engine.py`, `redactor.py`, `templates/` | Async orchestration, scoring, template router |
| **T5** | `backend/src/db/`, `frontend/` | `audit_logger.py`, `app/main.py`, `pages/` | PostgreSQL logging, Streamlit dashboard, metrics |

---

## 🔗 **INTEGRATION CONTRACTS (How They Connect)**

1. **Backend Internal Contract:** 
   - `engine.py` calls detectors → returns `dict[str, float]` scores
   - `redactor.py` takes text + violations → returns `str` redacted_text
   - `audit_logger.py` consumes `GuardResponse` → async inserts to PostgreSQL

2. **Frontend ↔ Backend Contract:**
   - Dashboard calls `GET /v1/health` & `GET /v1/metrics` (Prometheus format)
   - Dashboard queries `POST /v1/audit/search` with pagination params
   - Shared `.env.example` defines `BACKEND_URL` for local/prod routing

3. **Platform Deployment:**
   - `render.yaml` defines two services: `aegisguard-api` (backend) & `aegisguard-dashboard` (frontend)
   - Both deploy natively (no Docker). Backend uses `Procfile` Gunicorn command. Frontend uses `streamlit run app/main.py`.

---

## 🚀 **QUICK START COMMANDS**

```bash
# 1. Clone & initialize
git clone <repo> && cd AegisGuard
bash scripts/setup_env.sh

# 2. Backend (Teammates 1-4 + T5 DB)
cd backend
pip install -r requirements.txt
python -m scripts.download_models  # Pulls ONNX/Presidio binaries
uvicorn src.main:app --reload --port 8000

# 3. Frontend (Teammate 5)
cd frontend
pip install -r requirements.txt
streamlit run app/main.py --server.port 8501

# 4. Run Tests
pytest backend/tests/ -v
pytest frontend/tests/ -v
```

---

## ✅ **WHY THIS WORKS FOR HACKATHONS**

- **Zero Blocking:** T1 can build routing while T3 downloads models and T5 builds dashboard UI. No merge conflicts.
- **Clear Boundaries:** Backend exposes strictly typed REST endpoints. Frontend consumes them. Database schema is version-controlled in `migrations/`.
- **Production-Ready:** Matches PRD exactly: FastAPI + ONNX + asyncpg + Redis + Streamlit. No Docker, no mocks, no architectural debt.
- **Easy Merge:** Integration is just wiring `engine.py` into `guard.py` and pointing Streamlit to `BACKEND_URL`. All interfaces are Pydantic-validated.

Copy this structure into your workspace. Each teammate gets a dedicated folder with explicit ownership. When ready to integrate, run the backend, point the frontend to `http://localhost:8000`, and you have a complete, production-grade system. 🏆
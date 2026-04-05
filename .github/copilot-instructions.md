# Formato de Asistencia a Actividades — Project Guidelines

Sistema de gestión de formaciones, capacitaciones, eventos y registro de asistencia con QR.
Ver estructura detallada en [docs/README_STRUCTURE.md](../docs/README_STRUCTURE.md).

## Architecture

**Monorepo** con dos servicios independientes:

- **Backend** (`backend/`) — FastAPI 0.115+, Python 3.10+, Pydantic v2
- **Frontend** (`frontend/`) — React 18 + Vite, React Router v6, Axios

**Storage dual:** `STORAGE_MODE=json` (local, dev) | `STORAGE_MODE=cosmosdb` (Azure, prod)  
**Blob storage:** `BLOB_STORAGE_MODE=local` | `BLOB_STORAGE_MODE=azure`  
**Auth:** Microsoft Entra ID (MSAL) → JWT HS256 sessions (`SESSION_SECRET`)

Key env vars: `ENTRA_CLIENT_ID`, `ENTRA_TENANT_ID`, `ENTRA_CLIENT_SECRET`, `SESSION_SECRET`, `COSMOS_ENDPOINT`, `COSMOS_KEY`, `AZURE_STORAGE_CONNECTION_STRING`. Never commit `.env`.

## Build & Run

```powershell
# Backend
cd backend
python -m venv .venv ; .\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
# → http://localhost:8000/docs

# Frontend
cd frontend
npm install --force
npm run dev
# → http://localhost:3000
```

Docker: `docker compose up --build` from root.

## Backend Conventions

**Layer structure:** `api/endpoints/` → `services/` → `db/repositories/` → Cosmos/JSON

- All endpoints use `Depends(get_current_user)` for auth; returns decoded JWT payload
- Rate limiting via `@limiter.limit("N/minute")` (slowapi) on every endpoint
- Pydantic v2 models in `schemas/`; use field validators + regex for input validation
- Cosmos queries use `@placeholder` parameterization — never string-format user input
- `BaseRepository` + `cosmos_retry()` for all Cosmos operations (3 retries, exponential backoff)
- `STORAGE_MODE` branch in `services/sesiones/crud.py` — always maintain both branches when editing
- Custom exceptions in `core/exceptions.py` → map to specific HTTP status codes (404, 409, 410, 403)
- Return explicit status codes: `status_code=201` for POST, `204` for DELETE

**Sesión data model key fields:** `tema`, `actividad` (enum: Inducción/Formación/Capacitación/Otros (eventos)), `ocurrencias` (array of occurrences with inheritance from session root), `token` per occurrence for QR registration.

## Frontend Conventions

**No global state library** — component `useState` + `localStorage` for persistence.

Custom hooks live in `src/components/talento/.../hooks/`; keep business logic there, not in JSX.

- Auth token + user info stored in `localStorage` keys `authToken` and `userInfo`
- `userInfo.rol` drives UI permissions: `"Usuario"` | `"Administrador"`
- `src/utils/permisos.js` → `obtenerPermisos()` caches permissions for 5 min; call `invalidarCachePermisos()` after permission changes
- API base URL resolved via `src/utils/constants.js` `getApiUrl()` — respects `VITE_API_URL` env var
- Axios interceptor in `src/services/api.js` injects `Authorization: Bearer {token}` and handles 401 globally
- Common components exported from `src/components/common/index.js`: `Button, Input, Modal, Select, Toast, Loading, BrandSpinner, Checkbox, Radio, Header, HelpTooltip`
- Use `date-fns` for date formatting; `exceljs` + `file-saver` for Excel export; `recharts` for charts

**Login flow:** `GET /api/auth/login` → Microsoft OAuth → `GET /api/auth/callback` → redirect to `/auth-success?token=...` → frontend stores token → verify with `GET /api/auth/me`.

## Security Requirements

- Email domain restricted to `@fundacionsantodomingo.org` — enforced in backend callback, do not remove
- Azure Blob files are **private** — always served through backend proxy (`proxy.router`), never expose SAS tokens to frontend
- Do not expose `SESSION_SECRET` or Azure credentials; validate they come from env vars
- CSRF state token validated in OAuth callback via `pkce_states` dict — maintain this check

## Cosmos DB Partition Key

All containers use `/id` as partition key. When adding new containers, follow the same pattern in `db/cosmos_client.py`.

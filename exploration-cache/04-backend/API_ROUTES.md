# API Routes

Last reviewed: 2026-05-17

## Implemented backend routes in repository
- `GET /health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/bootstrap/login`
- `POST /api/v1/auth/internal/login`
- `GET /api/v1/admin/personnel?search=`
- `GET /api/v1/admin/internal-accounts`
- `POST /api/v1/admin/internal-accounts/activate`
- `GET /api/v1/admin/organizations`
- `GET /api/v1/admin/account-requests`
- `GET /api/v1/admin/audit-logs`

## Route notes
- Admin routes use authentication plus capability middleware.
- `auth/internal/login` is included as foundation for the personnel-backed internal login flow.
- `admin/audit-logs` is guarded by `AUDIT_VIEW` and intended for API-1 auth/admin audit verification.
- The requested verification endpoints are intentionally read/scaffold-heavy; full request/dossier workflow endpoints are not implemented yet.

## Frontend-expected route patterns (generic/items only)
- /items
- /items/:id
(from apps/admin/src/features/items/api/items.api.ts)

## AIDN API adapter state
- apps/admin/src/features/aidn/api/aidn.api.ts uses assertMockOnly() when not in mock mode.
- Error message: "AIDN API is not configured. Phase B provides mock data only."
- The admin frontend has not yet been wired to `apps/api`.

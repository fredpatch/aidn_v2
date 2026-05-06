# API Routes

Last reviewed: 2026-05-05

## Implemented backend routes in repository
- None found.

## Frontend-expected route patterns (generic/items only)
- /items
- /items/:id
(from apps/admin/src/features/items/api/items.api.ts)

## AIDN API adapter state
- apps/admin/src/features/aidn/api/aidn.api.ts uses assertMockOnly() when not in mock mode.
- Error message: "AIDN API is not configured. Phase B provides mock data only."

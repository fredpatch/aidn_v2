# Backend Architecture

Last reviewed: 2026-05-05

## Reality in this workspace
- No backend server source (no Express/Nest/Fastify service folders found).
- Workspace is frontend-centered with optional API mode hooks.

## What exists
- Frontend API client helper: apps/admin/src/lib/api/client.ts
- DATA_MODE switch: apps/admin/src/lib/data/data-mode.ts
- API URL env var placeholder: VITE_API_BASE_URL

## Conclusion
- Current prototype behavior is effectively frontend mock/local state only for AIDN domain.

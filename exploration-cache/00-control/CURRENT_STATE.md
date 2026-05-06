# Current State

Last reviewed: 2026-05-05

## Project status
- Vite + React + TypeScript admin app in apps/admin.
- Data mode defaults to mock (VITE_DATA_MODE=mock).
- AIDN module is mock-first; API mode throws explicit "not configured" errors for AIDN endpoints.
- Auth is demo-only localStorage token gate (aidn-demo-token).

## Implemented modules
- Dashboard
- Demandes
- Courriers / orientation DG
- Dossiers DN (+ detailed dossier workspace)
- Workflow OMA
- Documents
- Reunions
- Certificats
- Reports
- Settings
- Portal preview (home + dossier detail tabs)

## Portal state
- Route /portal-preview is a simplified postulant home.
- Route /portal-preview/dossiers/:id is a tabbed detail page.
- Portal stays read-only (no real upload/payment/submission/auth flow).

## Mock/demo limitations
- No production backend wired for AIDN feature set.
- Many actions mutate browser localStorage only (aidn.demo.state.v1).
- Outlook/email/storage are represented as labels or notes, not active integrations.

## Next recommended implementation target
- Define real backend contracts for AIDN entities and align React Query hooks to API mode.
- Keep portal wording simplified while preserving internal/admin richness.

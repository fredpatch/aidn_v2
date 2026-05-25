# OMA-OPS-6 - Courriers tab for dossier cockpit

Date: 2026-05-25
Status: Complete

Summary: `exploration-cache/tasks/summaries/2026-05-25-oma-ops-6-courriers-tab.md`

Implemented the dossier cockpit Courriers tab as a read-only consultation view.

Key points:

- `getAdminDossier` now exposes narrow courrier metadata for initial courrier
  and initial DG orientation.
- Request-side document download allows only request-linked initial courrier
  documents and initial DG returned scans.
- Frontend Courriers tab renders initial request rows, preliminary courrier rows,
  optional closure courrier state, and future-phase placeholder.
- No DG circuit action, upload, print/mark-in-circuit action, Outlook/email
  behavior, or permission loosening was added.

Verification:

- API `npx tsc --noEmit`: PASS
- API `npm run build`: PASS
- Admin `npx tsc --noEmit`: PASS
- Admin `npm run build`: PASS after outside-sandbox rerun for Tailwind native
  Windows binary.

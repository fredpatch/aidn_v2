# OMA-OPS-8A - Certificat Readonly Tab

Date: 2026-05-25
Status: Complete - admin typecheck/build PASS

## Summary

The dossier cockpit Certificat tab now renders a frontend-only readonly readiness view from existing `AdminDossierDetail` data. It does not add backend behavior or certificate mutations.

## Changed files

- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierCertificatTab.tsx`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-certificat-readonly-tab-implementation.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`

## Behavior

- Shows current certificate readiness state:
  - not started before delivery phase;
  - delivery active when dossier/phase data indicates Phase 5;
  - archive/readiness messaging for closed dossiers.
- Shows dossier-derived certificate information.
- Shows delivery phase status/dates when available.
- Shows expected certificate documents as not yet available.
- Shows target lifecycle preview.
- Explains that actions remain unavailable until the real certificate backend is implemented.

## Verification

- Admin `npx tsc --noEmit`: PASS
- Admin `npm run build`: PASS after outside-sandbox rerun for the known Tailwind native Windows binary issue.

## Remaining follow-up

Runtime browser validation and OMA-OPS-8B backend model/API implementation.

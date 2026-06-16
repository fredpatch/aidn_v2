# OMA-OPS-8A - Certificat Readonly Tab Implementation

Date: 2026-05-25
Status: Complete - admin typecheck/build PASS

## Objective

Implement the approved OMA-OPS-8A frontend-only readonly Certificat tab using existing `AdminDossierDetail` data. Do not add backend, certificate model/API, mutation actions, upload actions, DG circuit actions, Outlook, or email behavior.

## Cache files read

- `prompt.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-certificat-tab-plan.md`

## Source files inspected

- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierCertificatTab.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`

## Files changed

- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/pages/dossiers/DossierCertificatTab.tsx`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8a-certificat-readonly-tab-implementation.md`
- `exploration-cache/tasks/history/2026-05-25-oma-ops-8a-certificat-readonly-tab.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/manifest.json`

## Key decisions

- Kept the slice frontend-only.
- Reused existing `AdminDossierDetail`, `dossierTypeLabels`, `dossierStatusLabels`, `phaseKeyLabels`, `formatDate`, and `PhaseStatusBadge`.
- Did not introduce a certificate API type or fake certificate state.
- Did not expose any disabled action buttons that could imply backend support.
- Used unaccented French strings in the new file to avoid encoding churn in the current mixed-encoding codebase.

## Implementation details

- `DossierDetailPage` now passes `detail` into `DossierCertificatTab`.
- `DossierCertificatTab` renders:
  - header and readonly status;
  - certificate information derived from dossier organization, postulant, dossier type/status, and dossier number;
  - delivery phase status/dates if `detail.phases` contains `phaseKey === "delivery"`;
  - expected document placeholders for certificate template, generated certificate, DG signed scan, and final signed scan;
  - target certificate lifecycle preview from OMA-OPS-8 planning;
  - explicit readonly/no-action explanation.
- Current status is derived locally:
  - closed dossier -> archive/readiness messaging;
  - `delivery_phase` dossier or active delivery phase -> delivery active but backend missing;
  - otherwise -> not started / certificate only applies in Phase 5.

## Verification commands run

- `cd apps/admin && npx tsc --noEmit` - PASS
- `cd apps/admin && npm run build` - sandbox failed on known Tailwind native Windows binary / `spawn EPERM`
- `cd apps/admin && npm run build` outside sandbox - PASS

## Manual checks

- Not run in browser during this pass.

## Known risks / TODOs

- Runtime checks are still needed on dossiers in pre-delivery, delivery, and closed states.
- The tab remains intentionally readonly until OMA-OPS-8B adds the real certificate model/API.
- No real certificate document downloads are possible yet because no certificate document allowlist/API exists.

## Next step

OMA-OPS-8B: implement the backend certificate model/API, permissions, dossier serializer extension, and certificate document download allowlist.

# OMA-HARDENING-4 - Phase 2 Historique Planning

Date: 2026-05-28
Status: Planning complete - awaiting approval

## Objective

Add Phase 2 formal request events to the admin dossier Historique tab without changing backend workflow rules, Phase 1 behavior, portal behavior, Documents/Reunions/Courriers tab behavior, Phase 2 closure logic, or Phase 3.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-1-phase-1-2-audit.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-3-admin-phase-2-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-16-phase-2-documents-tab-refactor.md`
- `exploration-cache/tasks/summaries/2026-05-28-oma-formal-17-block-closure-until-documents-deposited.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-28-oma-hardening-4-phase-2-historique-planning.md`
- `exploration-cache/tasks/current-task.md`

## Current event model confirmed

- `DossierHistoriqueTab` builds a frontend-only synthetic timeline through `buildHistoryEvents(detail)`.
- Events use `category`, `importance`, and `group` metadata.
- Default `Jalons` filter shows only `importance === "milestone"`.
- Other filters are `Tous`, `Reunions`, `Documents`, `Courriers`, and `DG`.
- Document download buttons are supported only when an event has `documentId` plus `documentDownloadKind`.
- The tab already supports dossier document downloads and request-side courrier/orientation downloads.

## Available Phase 2 fields

`AdminFormalRequestPhaseState` exposes:

- `phase.status`, `phase.formalRequestStatus`, and close/send capability booleans.
- `gate.exists`, `gate.formalRequestCourrierId`, `gate.source`, `gate.receivedAt`.
- `meeting.id`, `meeting.status`, `meeting.scheduledAt`, `meeting.location`, `meeting.reportDocumentId`.
- `requirements[]` with `code`, `label`, `formCode`, `requirementLevel`, aggregate `status`, and `submissions[]`.
- Each submission has `submissionId`, `documentId`, `uploadedAt`, `status`, `source`, and optional `reviewComment`.
- `closure.recevabilityCourrierDocumentId`, `closure.phaseClosureCourrierDocumentId`, `closure.canClosePhase`.

## Key decisions

- Reuse the separate-load pattern from `DossierDocumentsTab`: call `getAdminFormalRequestPhase(detail.dossier.id)` and silently ignore failures/not-started Phase 2.
- Extend `buildHistoryEvents` to accept optional formal state rather than changing `AdminDossierDetail`.
- Keep default timeline compact: core Phase 2 milestones only plus selected `oma_approval_form` review outcomes.
- Put per-submission Phase 2 document deposit/review events in `Documents` and `Tous` via `importance: "detail"`.
- Do not add a formal request courrier download button because `gate.formalRequestCourrierId` is a courrier id, not a confirmed dossier document id.
- Use existing dossier document download behavior only for Phase 2 submissions and closure evidence document IDs.

## Proposed event additions

Milestones:

- `Demande formelle reçue` from `gate.receivedAt`.
- `Circuit DG demande formelle lancé` inferred from `phase.formalRequestStatus` reaching `formal_sent_to_dg` or later, dated with best available Phase 2 state.
- `Retour DG demande formelle enregistré` inferred from status reaching `formal_dg_returned` or later.
- `Réunion formelle planifiée` from `meeting.scheduledAt`.
- `Réunion formelle tenue` from `meeting.status === "held"` using `scheduledAt` as fallback date because the current type does not expose `heldAt`.
- `Compte rendu de réunion formelle joint` from `meeting.reportDocumentId`.
- `Phase 2 - Demande formelle clôturée` from `phase.formalRequestStatus === "formal_closed"`; no explicit closed date is exposed in the current frontend type, so date fallback must be documented or derived only if available at runtime.

Document events:

- Default `Jalons`: only `oma_approval_form` status milestones for `validated`, `requires_correction`, and `incomplete`.
- `Documents`/`Tous`: per-submission `document deposited` events can be derived from `requirements[].submissions[].uploadedAt`.
- Consultation-only documents remain detail events so they do not dominate `Jalons`.

## Verification commands planned

- `cd apps/admin; npx tsc --noEmit`
- `cd apps/admin; npm run build`

## Manual checks planned

- Not runnable during planning.
- After implementation: check Phase 1-only dossier, Phase 2 milestones, formal meeting, Phase 2 closure, Documents filter, and compact Jalons behavior.

## Known risks / TODOs

- `AdminFormalRequestPhaseState` does not expose explicit DG sent/returned/decision timestamps, formal meeting `heldAt`, or formal phase `closedAt`.
- Some Phase 2 milestone dates may need conservative fallback dates unless the backend/client type is extended in a later slice.
- Browser runtime checks still require a live configured API.

## Next step

Await approval to implement the minimal admin-only Historique changes.

# OMA-OPS-7 - Historique tab planning for dossier cockpit

Date: 2026-05-25
Phase: planning
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan the dossier cockpit Historique tab. Determine whether the MVP can be derived from existing dossier detail data, whether audit logs are reusable today, and define the target timeline event model and implementation scope.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-3d-closure-without-upload.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-4-documents-tab-downloads.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-5-reunions-tab.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-6-courriers-tab.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/pages/DossierDetailPage.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/api/admin.api.ts`
- `apps/admin/src/pages/AuditLogsPage.tsx`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/api/src/modules/audit/audit-log.model.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/requests/request.service.ts`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-7-historique-tab-plan.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Current Historique tab state

- `DossierHistoriqueTab.tsx` is still a placeholder card.
- `DossierDetailPage.tsx` renders `<DossierHistoriqueTab />` without passing `detail`.
- The tab shell is already available from OMA-OPS-2.

## Existing audit capabilities

- `audit-log.model.ts` includes indexed fields: `actorId`, `action`, `entityType`, `entityId`, `dossierId`, and `requestId`.
- `writeAuditLog` currently accepts only `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `before`, `after`, `metadata`, and `session`.
- Because `writeAuditLog` does not accept `dossierId` or `requestId`, current audit writes do not populate those dedicated fields.
- `listAuditLogs` only supports `action`, `actorId`, `limit`, and `page` filters.
- `GET /api/v1/admin/audit-logs` is guarded by `AUDIT_VIEW` and only forwards `action`, `actorId`, `limit`, and `page`.
- The admin `AuditLogsPage` consumes the global audit list only; no dossier/request scoped audit API exists.

Conclusion: backend audit exists, but it is not currently reusable for a dossier-scoped Historique tab without backend work.

## Existing data available for derived history

`AdminDossierDetail` already provides enough data for an MVP timeline:

- `detail.dossier.openedAt`
- `detail.dossier.createdAt`
- `detail.dossier.updatedAt`
- `detail.dossier.requestId`
- `detail.phases[]`
- `detail.preliminary.phase.startedAt`
- `detail.preliminary.phase.closedAt`
- `detail.preliminary.firstMeeting`
- `detail.preliminary.preliminaryMeeting`
- preliminary document fields:
  - `firstMeetingReportDocumentId`
  - `preEvaluationTemplateDocumentId`
  - `completedPreEvaluationDocumentId`
  - `preEvaluationDgAnnotatedDocumentId`
  - `preliminaryMeetingReportDocumentId`
  - `closureCourrierDocumentId`
- `detail.courriers.initialCourrier`
- `detail.courriers.initialDgOrientation`

## Recommended implementation option

Implement OMA-OPS-7 as **frontend-only MVP derived history**.

Reasoning:

- The existing dossier detail payload already supports a useful lifecycle trace.
- It avoids adding an audit API that would be partially misleading because current logs are not consistently linked by `dossierId`/`requestId`.
- It matches the current cockpit pattern from Documents, Reunions, and Courriers tabs.
- Actor-level audit can be added later as OMA-OPS-7B after the audit writer and filters are made dossier/request-aware.

## Target event list

### Dossier

- `Dossier ouvert`
  - Source: `detail.dossier.openedAt`
  - Category: `dossier`

### Phase

- `Phase preliminaire demarree`
  - Source: `detail.preliminary.phase.startedAt`
  - Category: `phase`
- `Phase preliminaire cloturee`
  - Source: `detail.preliminary.phase.closedAt`
  - Category: `phase`

### Reunions

- `Premiere reunion de contact planifiee`
  - Source: `detail.preliminary.firstMeeting.scheduledAt`
  - Category: `meeting`
- `Premiere reunion de contact tenue`
  - Source: first meeting `status === "held"` with `createdAt` fallback
  - Category: `meeting`
- `Reunion preliminaire planifiee`
  - Source: `detail.preliminary.preliminaryMeeting.scheduledAt`
  - Category: `meeting`
- `Reunion preliminaire tenue`
  - Source: preliminary meeting `status === "held"` with `createdAt` fallback
  - Category: `meeting`

### Documents

- `Compte rendu premiere reunion joint`
  - Source: `firstMeetingReportDocumentId`
  - Category: `document`
  - Download: dossier document
- `Formulaire pre-evaluation mis a disposition`
  - Source: `preEvaluationTemplateDocumentId`
  - Category: `document`
  - Download: dossier document
- `Formulaire pre-evaluation complete recu`
  - Source: `completedPreEvaluationDocumentId`
  - Category: `document`
  - Download: dossier document
- `Retour DG pre-evaluation enregistre`
  - Source: `preEvaluationDgAnnotatedDocumentId`
  - Category: `dg_orientation`
  - Download: dossier document
- `Compte rendu reunion preliminaire joint`
  - Source: `preliminaryMeetingReportDocumentId`
  - Category: `document`
  - Download: dossier document

### Courriers

- `Courrier initial recu/transmis`
  - Source: `detail.courriers.initialCourrier`
  - Category: `courrier`
  - Download: request document if `documentId`
- `Retour DG orientation initiale enregistre`
  - Source: `detail.courriers.initialDgOrientation`
  - Category: `dg_orientation`
  - Download: request document if `documentId`
- `Courrier de cloture phase I joint`
  - Source: `closureCourrierDocumentId`
  - Category: `courrier`
  - Download: dossier document

## Event shape

```ts
type DossierHistoryEvent = {
  id: string;
  date?: string;
  title: string;
  description?: string;
  category:
    | "dossier"
    | "phase"
    | "meeting"
    | "document"
    | "courrier"
    | "dg_orientation"
    | "notification"
    | "audit";
  actorLabel?: string;
  status?: "done" | "pending" | "info";
  documentId?: string;
  documentDownloadKind?: "dossier" | "request";
  requestId?: string;
};
```

## Timeline UI plan

- Pass `detail` into `DossierHistoriqueTab`.
- Build normalized events inside the tab with a helper like `buildHistoryEvents(detail)`.
- Sort oldest first for workflow traceability.
- Render a compact vertical timeline:
  - date/time
  - event title
  - short description
  - category badge
  - actor label when known
  - download/consult button when `documentId` and download kind exist
- Events without dates appear at the bottom under `Date non renseignee`.
- Use calm empty state if no events can be derived.
- Do not show technical IDs.
- Do not add mutation actions.

## Download behavior

- For dossier documents, use existing `downloadDossierDocument(detail.dossier.id, documentId)`.
- For request-side courrier/orientation documents, use existing `downloadRequestOrientationDocument(requestId, documentId)`.
- Reuse the `openBlobInNewTab` pattern from Documents/Reunions/Courriers tabs.

## Backend changes needed or not

For OMA-OPS-7 MVP: **no backend changes needed**.

For audit-driven production history later: backend changes are needed:

- Extend `writeAuditLog` input to accept and persist `dossierId` and `requestId`.
- Update OMA/request services to pass these fields consistently.
- Extend `listAuditLogs` filters with `entityType`, `entityId`, `dossierId`, and `requestId`.
- Add or reuse an admin route for scoped audit queries.
- Add frontend API helper for scoped audit history.

## Implement now vs later

Implement now:

- Frontend-only derived timeline from `AdminDossierDetail`.
- Dossier, phase, meeting, document, courrier, and DG orientation events listed above.
- Existing secure document download helpers.

Later:

- OMA-OPS-7B - audit backend integration.
- Actor attribution from audit logs.
- Notifications and formal phase events beyond preliminary.
- Cross-phase complete history once phases 2-5 have real workflows.

## Implementation prompt for OMA-OPS-7

Implement the Historique tab frontend-only.

- Update `DossierDetailPage.tsx` to render `<DossierHistoriqueTab detail={detail} />`.
- Replace `DossierHistoriqueTab.tsx` placeholder with a derived timeline.
- Define `DossierHistoryEvent` and `buildHistoryEvents(detail)`.
- Use existing `AdminDossierDetail`, `downloadDossierDocument`, and `downloadRequestOrientationDocument`.
- Render events oldest-first, with undated events last.
- Show category badges, date/time, title, description, optional actor label, and download button where available.
- Do not add backend changes.
- Do not add audit log calls.
- Do not add mutation/upload/DG circuit/Outlook/email actions.
- Run admin `npx tsc --noEmit` and `npm run build`.

## Risks / TODOs

- Derived MVP is not an authoritative audit trail.
- Actor details are mostly unavailable from dossier detail, except future serializer fields or audit integration.
- Some document events lack precise timestamps because dossier detail exposes document IDs but not document uploaded dates.
- Meeting `createdAt` can serve as a fallback, but held timestamps are not explicit.
- Current UI strings include mojibake in several files; keep implementation scoped and do not perform broad accent cleanup.

## Next step

Await approval to implement the frontend-only derived Historique tab.

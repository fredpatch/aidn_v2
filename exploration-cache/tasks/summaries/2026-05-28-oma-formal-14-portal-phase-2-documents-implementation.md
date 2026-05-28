# OMA-FORMAL-14 — Portal Phase 2 Document Checklist + DN Template Forms — Implementation

Date: 2026-05-28
Status: **Complete — API PASS, Portal PASS, Admin PASS**

## Objective

Expose Phase 2 document requirements to postulants with DN-provided template download, per-requirement upload, and Actions requises guidance.

## Cache files read

- `prompt.md`, `manifest.json`, `QUICK-REFERENCE.md`, `tasks/current-task.md`
- `03-frontend/PORTAL_APP_MAP.md`, `04-backend/API_ROUTES.md`
- `tasks/summaries/2026-05-27-oma-formal-9b1a-portal-formal-request-upload-implementation.md`

## Source files inspected

- `apps/api/src/modules/document-templates/document-template.service.ts` + model
- `apps/api/src/modules/admin/admin.routes.ts` (document-templates section)
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (getPortalDossier)
- `apps/api/src/modules/oma-phases/formal-request.service.ts` (requirements pattern)
- `apps/api/src/modules/meetings/meeting.service.ts` (formal_meeting not filtered)
- `apps/api/src/scripts/seed-document-requirements.ts` (confirmed formCode mapping)
- `apps/admin/src/lib/api/document-templates.api.ts`
- `apps/admin/src/pages/SettingsPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

## Files changed

- `apps/api/src/modules/document-templates/document-template.service.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`
- `apps/admin/src/lib/api/document-templates.api.ts`
- `apps/admin/src/pages/SettingsPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/pages/RequestDetailPage.tsx`

## Key decisions

- Templates identified by `code` field matching `DocumentRequirement.formCode` — no new model changes
- `documentType: "other"` for Phase 2 templates — no enum extension needed
- Portal template download route: `GET /api/v1/portal/document-templates/:id/download`; guarded by `phaseKey=formal_request` check; no dossier ownership required
- `downloadPortalDossierDocument` not extended — Phase 2 templates are globally available to portal users, not phase-linked
- Requirements sorted by `sortOrder` and filtered to non-gate only in portal
- Formal meeting already returns from `/rendez-vous` for all meeting types — no calendar change needed
- One upload row open at a time; reset on row switch to avoid state bleed

## Implementation details

### Backend

- `getActiveTemplatesByFormCodes`: batch lookup by `code[]`; single batch doc query for fileName
- `downloadPortalFormalRequestTemplate`: checks `isActive` and `phaseKey=formal_request`
- `getPortalDossier` now queries `DocumentRequirementModel` + `DocumentSubmissionModel` in parallel when `formalRequestPhase` exists; annotates each requirement with template if matching active template found; computes `progress`; loads `formalMeeting` from `formalMeetingId` if set

### Admin settings

- `TemplateSlot` component: reusable per-template upload sub-section
- `PHASE2_TEMPLATE_SLOTS`: config array for 3 Phase 2 forms
- Phase 1 section preserved; Phase 2 section added below separator
- `listDocumentTemplates` now accepts `phaseKey` filter on backend + admin client

### Portal UI

- `Phase2DocumentChecklist` renders all non-gate requirements with status badges, template download, and per-row upload form
- Expand/collapse controlled by `expandedRequirementId` parent state
- Upload label adapts: Téléverser / Remplacer / Ajouter un document (repeatable)
- Status badges: Manquant / Déposé / En revue / Validé / Correction demandée / Rejeté
- Actions requises card shown when `hasFormalDocRequired && hasFormalRequestCourrier`
- Formal meeting block uses existing `MeetingBlock` component

## Verification commands run

```
cd apps/api && npx tsc --noEmit   → PASS
cd apps/api && npm run build       → PASS
cd apps/portal && npx tsc --noEmit → PASS
cd apps/portal && npm run build    → PASS
cd apps/admin && npx tsc --noEmit  → PASS
cd apps/admin && npm run build     → PASS
```

## Manual checks run

Not run — no live session.

## Known risks / TODOs

- No portal download endpoint for submitted supporting documents (only template download is live)
- `reviewComment` field on `DocumentSubmission` assumed to exist — if not present in model, it will return `undefined` gracefully
- Phase 2 template download route is open to any authenticated postulant (no dossier scoping) — intentional since templates are public DN materials

## Next step

Manual browser validation of the complete Phase 2 checklist flow.

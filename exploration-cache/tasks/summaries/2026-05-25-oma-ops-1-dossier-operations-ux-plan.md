# OMA-OPS-1 - Audit & UX Plan: Dossier DN / OMA Phase Operations

Date: 2026-05-25
Status: **Complete - planning only, no code changed**

---

## Objective

Audit current Dossier DN UI, backend capabilities, and permissions. Produce a concrete UX/architecture plan for the Dossier DN operational workspace.

---

## Files Inspected

| File                                                   | Lines             | Notes                             |
| ------------------------------------------------------ | ----------------- | --------------------------------- |
| `apps/admin/src/pages/DossierDetailPage.tsx`           | 1227              | Monolithic, all inline            |
| `apps/admin/src/pages/DossiersPage.tsx`                | 494               | ManagementPageShell + DataTable   |
| `apps/admin/src/lib/api/dossiers.api.ts`               | 212               | All preliminary endpoints + types |
| `apps/api/src/modules/oma-phases/oma-phase.service.ts` | 1100              | Full preliminary backend          |
| `apps/api/src/modules/admin/admin.routes.ts`           | (dossier section) | Route guards, endpoint list       |
| `apps/api/src/shared/permissions/permissions.ts`       | 121               | All permissions + role mappings   |

---

## Current UI Assessment

### DossiersPage (list)

- `ManagementPageShell` + `DataTable` with pagination, search, status/type filters, 4 KPI cards.
- Row click → navigate to `/dossiers/:id` (full-page navigation, no split-view).
- **Assessment**: Good as-is. No split-view needed here - list + full-page detail is correct for complex dossiers.

### DossierDetailPage (detail)

- **1227 lines, entirely monolithic** - no tabs, flat vertical card stack.
- Layout: [Vue d'ensemble card] → [Phases OMA card (overview list only)] → [Phase préliminaire - Actions card (inline action panel)].
- `PreliminaryActionPanel` (~300 lines): giant if/else cascade on `preliminaryStatus`.
- All sub-forms are inline in the same file: `InviteMeetingForm`, `RecordMeetingForm`, `SendToDgPanel`, `RecordDgReturnForm`, `UploadClosureCourrierForm`.
- Only `closePreliminaryPhase` uses a Dialog confirmation - all other actions are inline expanded forms.
- **Assessment**: Functional but will not scale. No clear next-action guidance. Evidence blocks absent. No document download links except annotated DG return.

---

## Current Backend/API Capabilities

### Dossier routes (`GET/POST /api/v1/admin/dossiers/...`)

| Endpoint                               | Guard                        | Status                                                           |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `GET /dossiers`                        | `DOSSIER_VIEW_ALL`           | ✓ existing                                                       |
| `GET /dossiers/:id`                    | `DOSSIER_VIEW_ALL`           | ✓ existing                                                       |
| `POST .../invite-first-meeting`        | `MEETING_MANAGE`             | ✓ existing                                                       |
| `POST .../record-first-meeting`        | `MEETING_MANAGE`             | ✓ existing                                                       |
| `POST .../publish-pre-evaluation-form` | `DOCUMENT_UPLOAD_INTERNAL`   | ✓ existing                                                       |
| `POST .../send-pre-eval-to-dg`         | `PRE_EVAL_DG_CIRCUIT_HANDLE` | ✓ existing                                                       |
| `POST .../record-pre-eval-dg-return`   | `PRE_EVAL_DG_CIRCUIT_HANDLE` | ✓ existing                                                       |
| `GET .../documents/:documentId`        | `DOSSIER_VIEW_ALL`           | ⚠️ partial - only validates `preEvaluationDgAnnotatedDocumentId` |
| `POST .../invite-preliminary-meeting`  | `MEETING_MANAGE`             | ✓ existing                                                       |
| `POST .../record-preliminary-meeting`  | `MEETING_MANAGE`             | ✓ existing                                                       |
| `POST .../upload-closure-courrier`     | `DOCUMENT_UPLOAD_INTERNAL`   | ✓ existing                                                       |
| `POST .../close`                       | `PHASE_CLOSE`                | ✓ existing                                                       |

**Gaps:**

- `GET .../documents/:documentId` only serves `preEvaluationDgAnnotatedDocumentId`. It needs extension to serve `completedPreEvaluationDocumentId`, `firstMeetingReportDocumentId`, `preliminaryMeetingReportDocumentId`, `closureCourrierDocumentId`.
- No endpoints exist for Phases 2–5 (formal_request, document_evaluation, inspection, delivery).
- No `GET .../documents` listing endpoint (would be needed for Documents tab).
- No `GET .../meetings` listing endpoint (meetings are embedded in dossier detail for preliminary only).

### AdminOmaPhase document fields (preliminary phase only)

| Field                                | Purpose                                |
| ------------------------------------ | -------------------------------------- |
| `preEvaluationTemplateDocumentId`    | Form template sent to postulant        |
| `completedPreEvaluationDocumentId`   | Postulant's submitted form             |
| `preEvaluationDgAnnotatedDocumentId` | DG return scan (annotated)             |
| `firstMeetingReportDocumentId`       | Compte rendu première réunion          |
| `preliminaryMeetingReportDocumentId` | Compte rendu réunion préliminaire      |
| `closureCourrierDocumentId`          | Courrier de clôture phase préliminaire |

---

## Target Dossier DN Information Architecture

### 1. What stays on DossiersPage (list)

- Keep everything: ManagementPageShell, DataTable, KPIs, filters.
- Optional future addition: assigned agent column, current phase column.

### 2. What moves into DossierDetailPage (cockpit)

- Everything currently in the detail page, restructured into tabs.
- The flat card stack becomes a tabbed cockpit with clear separation.

### 3. Tab structure

```
Vue d'ensemble | Phases OMA | Documents | Réunions | Courriers | Historique | Certificat
```

| Tab                | Content                                             | Priority                   |
| ------------------ | --------------------------------------------------- | -------------------------- |
| **Vue d'ensemble** | Dossier identity, org, postulant, key dates, status | OMA-OPS-2                  |
| **Phases OMA**     | Phase stepper + active phase workspace              | OMA-OPS-2                  |
| **Documents**      | All documents linked to dossier by phase/type       | OMA-OPS-4 (stub OMA-OPS-2) |
| **Réunions**       | All meetings chronologically                        | OMA-OPS-5 (stub OMA-OPS-2) |
| **Courriers**      | Phase closure letters, DG circuit courrierss        | later (stub OMA-OPS-2)     |
| **Historique**     | Audit log entries for this dossier                  | later (stub OMA-OPS-2)     |
| **Certificat**     | Certificate generation (delivery phase)             | later (stub OMA-OPS-2)     |

---

## Target Phases OMA Tab UX

### Layout

Use `SplitView` with `columns="[1fr_2fr]"`:

**Left panel** - Phase stepper list:

- Ordered list of all 5 phases
- Each row: phase number, label, `PhaseStatusBadge`
- Clickable to select active workspace on the right
- Active phase highlighted

**Right panel** - Phase workspace:

- Header: phase name, status badge, dates
- **Checklist**: ordered sub-steps with visual indicators (✓ done, → in-progress, ○ blocked/pending)
- **Evidence block**: document links for each completed sub-step (download buttons)
- **Action card**: the single current next action (not a cascade)
- **Dialog trigger**: button opens dialog for the action

### Phase préliminaire checklist (all sub-steps)

| #   | Step                                           | Trigger status                                             | Permission                   | Evidence field                           |
| --- | ---------------------------------------------- | ---------------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| 1   | Planifier première réunion                     | `preliminary_started`                                      | `MEETING_MANAGE`             | `firstMeetingId`                         |
| 2   | Tenir première réunion                         | `first_meeting_invited`                                    | `MEETING_MANAGE`             | `firstMeetingReportDocumentId`           |
| 3   | Mettre formulaire pré-évaluation à disposition | `first_meeting_held`                                       | `DOCUMENT_UPLOAD_INTERNAL`   | `preEvaluationTemplateDocumentId`        |
| 4   | Attendre soumission formulaire                 | `pre_eval_form_available`                                  | -                            | `completedPreEvaluationDocumentId`       |
| 5   | Consulter formulaire complété                  | `pre_eval_form_submitted`                                  | `DOSSIER_VIEW_ALL`           | `completedPreEvaluationDocumentId` (gap) |
| 6   | Mettre en circuit officiel DG                  | `pre_eval_form_submitted`                                  | `PRE_EVAL_DG_CIRCUIT_HANDLE` | -                                        |
| 7   | Enregistrer retour DG annoté                   | `pre_eval_sent_to_dg`                                      | `PRE_EVAL_DG_CIRCUIT_HANDLE` | `preEvaluationDgAnnotatedDocumentId`     |
| 8   | Consulter retour DG annoté                     | `pre_eval_dg_decision_recorded`                            | `PRE_EVAL_DG_RETURN_CONSULT` | `preEvaluationDgAnnotatedDocumentId`     |
| 9   | Planifier réunion préliminaire                 | `pre_eval_dg_decision_recorded`                            | `MEETING_MANAGE`             | `preliminaryMeetingId`                   |
| 10  | Tenir réunion préliminaire                     | `preliminary_meeting_invited`                              | `MEETING_MANAGE`             | `preliminaryMeetingReportDocumentId`     |
| 11  | Téléverser courrier de clôture                 | `preliminary_meeting_held`                                 | `DOCUMENT_UPLOAD_INTERNAL`   | `closureCourrierDocumentId`              |
| 12  | Clôturer phase préliminaire                    | `preliminary_meeting_held` or `preliminary_ready_to_close` | `PHASE_CLOSE`                | -                                        |

---

## Phase préliminaire Action Matrix

| Action                         | Current state           | Backend                  | Frontend                | Priority  |
| ------------------------------ | ----------------------- | ------------------------ | ----------------------- | --------- |
| Planifier première réunion     | existing inline form    | ✓                        | → dialog                | OMA-OPS-3 |
| Tenir première réunion         | existing inline form    | ✓                        | → dialog                | OMA-OPS-3 |
| Rendre formulaire disponible   | existing inline button  | ✓                        | → dialog (confirm)      | OMA-OPS-3 |
| Consulter formulaire complété  | missing                 | ⚠️ download endpoint gap | → evidence block button | OMA-OPS-4 |
| Envoyer en circuit officiel    | existing panel          | ✓                        | → dialog (confirm)      | OMA-OPS-3 |
| Enregistrer retour DG annoté   | existing inline form    | ✓                        | → dialog                | OMA-OPS-3 |
| Consulter retour DG annoté     | existing button         | ✓                        | keep as evidence button | OMA-OPS-3 |
| Planifier réunion préliminaire | existing inline form    | ✓                        | → dialog                | OMA-OPS-3 |
| Tenir réunion préliminaire     | existing inline form    | ✓                        | → dialog                | OMA-OPS-3 |
| Téléverser courrier de clôture | existing inline form    | ✓                        | → dialog                | OMA-OPS-3 |
| Clôturer phase préliminaire    | existing Dialog confirm | ✓                        | keep Dialog             | OMA-OPS-3 |

---

## Dialog List

All dialogs live in `apps/admin/src/pages/dossiers/` (new subfolder, co-located).

| Dialog component              | Replaces                           | Fields                               |
| ----------------------------- | ---------------------------------- | ------------------------------------ |
| `InviteMeetingDialog`         | `InviteMeetingForm` inline         | date, location, notes                |
| `RecordMeetingDialog`         | `RecordMeetingForm` inline         | file, notes, visibleToPostulant?     |
| `PublishPreEvalDialog`        | inline button                      | confirm only                         |
| `SendToDgDialog`              | `SendToDgPanel` inline             | confirm only (with instruction text) |
| `RecordDgReturnDialog`        | `RecordDgReturnForm` inline        | file, returnedAt, notes              |
| `UploadClosureCourrierDialog` | `UploadClosureCourrierForm` inline | file, title                          |
| `ClosePreliminaryDialog`      | existing shadcn Dialog             | confirm only (already good)          |

---

## Permissions Matrix

| Action/View                   | `dn_agent`                                    | `dn_supervisor` | `admin` | `dg_secretariat`               | `reception`/`bureau_courrier` |
| ----------------------------- | --------------------------------------------- | --------------- | ------- | ------------------------------ | ----------------------------- |
| View dossier list             | `DOSSIER_VIEW_ALL` ✓                          | ✓               | ✓       | -                              | -                             |
| View dossier detail           | `DOSSIER_VIEW_ALL` ✓                          | ✓               | ✓       | -                              | -                             |
| Planifier réunion             | `MEETING_MANAGE` ✓                            | ✓               | ✓       | -                              | -                             |
| Tenir réunion                 | `MEETING_MANAGE` ✓                            | ✓               | ✓       | -                              | -                             |
| Publier formulaire            | `DOCUMENT_UPLOAD_INTERNAL` ✓                  | ✓               | ✓       | -                              | -                             |
| Consulter formulaire complété | `DOSSIER_VIEW_ALL` (gap in download endpoint) | ✓               | ✓       | -                              | -                             |
| Envoyer en circuit DG         | -                                             | -               | ✓       | `PRE_EVAL_DG_CIRCUIT_HANDLE` ✓ | ✓                             |
| Enregistrer retour DG         | -                                             | -               | ✓       | `PRE_EVAL_DG_CIRCUIT_HANDLE` ✓ | ✓                             |
| Consulter retour DG annoté    | `PRE_EVAL_DG_RETURN_CONSULT` ✓                | ✓               | ✓       | ✓                              | ✓                             |
| Clôturer phase                | `PHASE_CLOSE` ✓                               | ✓               | ✓       | -                              | -                             |
| Téléverser courrier clôture   | `DOCUMENT_UPLOAD_INTERNAL` ✓                  | ✓               | ✓       | -                              | -                             |

---

## Implementation Slices

### OMA-OPS-2 - Tab shell + Vue d'ensemble + Phases OMA skeleton

**Scope: frontend only, no backend changes.**

- Refactor `DossierDetailPage.tsx` to use a tab component (shadcn `Tabs`).
- Extract tab content into co-located files under `apps/admin/src/pages/dossiers/`:
  - `DossierOverviewTab.tsx` - current Vue d'ensemble content
  - `DossierPhasesTab.tsx` - SplitView(stepper | workspace)
  - `DossierDocumentsTab.tsx` - stub
  - `DossierMeetingsTab.tsx` - stub
  - `DossierCourriersTab.tsx` - stub
  - `DossierHistoriqueTab.tsx` - stub
  - `DossierCertificatTab.tsx` - stub
- Phase stepper in left column of `DossierPhasesTab`.
- Move `PreliminaryActionPanel` content to right column, keep existing logic intact initially.
- Extract shared helpers/components from `DossierDetailPage.tsx` into `dossiers.helpers.ts` and small components.

**Deliverable**: File compiles. Tabs navigate. Preliminary phase still works. Other tabs show placeholder.

### OMA-OPS-3 - Phase préliminaire checklist + dialogs

**Scope: frontend only, no backend changes.**

- Replace `PreliminaryActionPanel`'s if/else cascade with a `PreliminaryPhaseWorkspace` component.
- Implement checklist view with step indicators.
- Extract all 7 inline forms into dialog components in `apps/admin/src/pages/dossiers/`:
  - `InviteMeetingDialog.tsx`
  - `RecordMeetingDialog.tsx`
  - `PublishPreEvalDialog.tsx`
  - `SendToDgDialog.tsx`
  - `RecordDgReturnDialog.tsx`
  - `UploadClosureCourrierDialog.tsx`
- `ClosePreliminaryDialog` already exists as a shadcn Dialog inline - extract to its own file.
- Evidence block in checklist shows linked document IDs with download buttons where applicable.

**Deliverable**: All preliminary actions work via dialogs. Checklist is readable. No inline form remains.

### OMA-OPS-4 - Download endpoint extension + Documents tab

**Scope: backend + frontend.**

- **Backend**: Extend `downloadAdminDossierDocument` in `oma-phase.service.ts` to serve all preliminary phase document types, not just `preEvaluationDgAnnotatedDocumentId`. Validate that `documentId` matches any of the 6 phase document fields.
- **Frontend**: Implement `DossierDocumentsTab` - grouped list of documents by phase/type with download buttons.

### OMA-OPS-5 - Réunions tab

**Scope: backend + frontend.**

- **Backend**: Extend `getAdminDossier` to return all meetings for all phases (not just preliminary). OR add `GET /dossiers/:id/meetings`.
- **Frontend**: Implement `DossierMeetingsTab` - chronological list of all meetings with status/dates/report links.

### OMA-OPS-6 - Phases 2–5 workspace stubs → then full implementation

**Scope: backend + frontend - phases 2–5 not yet started.**

- Add workspace stub for each of formal_request, document_evaluation, inspection, delivery.
- Define phase-specific action sets and checklist steps per phase.
- Backend endpoints TBD per phase.

---

## Risks and Open Questions

1. **Download endpoint gap**: `GET /dossiers/:id/documents/:documentId` currently rejects requests for any document except `preEvaluationDgAnnotatedDocumentId`. This means DN agents cannot yet download the completed pre-eval form, meeting reports, or closure courrier from the UI. Fixing this is OMA-OPS-4 backend work, but it's a data visibility gap today.

2. **`pre_eval_dg_returned` status**: According to `QUICK-REFERENCE.md`, this status is "dead - never set by backend". It appears in `PreliminaryStatus` type and `preliminaryStatusLabels` but `recordPreEvalDgReturn` jumps directly to `pre_eval_dg_decision_recorded`. Should be cleaned up (remove from type, labels, and any UI conditionals). Low priority but creates confusion.

3. **Tabs implementation**: shadcn `Tabs` component needed. Verify it's already in the admin app's shadcn component set before OMA-OPS-2 starts.

4. **Phase stepper - which phase is selected by default?** Recommend: auto-select the first `in_progress` phase, falling back to the last started.

5. **Phases 2–5 have no backend**: `closePreliminaryPhase` creates/activates the `formal_request` OmaPhase record, but no action endpoints exist. This means `DossierPhasesTab` will show phases 2–5 in "in_progress" or "not_started" status but with no actionable workspace.

6. **Document upload route guard for `publish-pre-evaluation-form`**: Currently unguarded by explicit permission middleware in the route (unlike other routes). Need to verify `asyncHandler` call in `admin.routes.ts` for this endpoint does enforce a permission - or it relies on `ensureInternalActor` only.

---

## Next Step

OMA-OPS-2: Tab shell refactor for DossierDetailPage.

- Prerequisite: confirm shadcn `Tabs` is available in the admin app.
- No backend changes.
- Return plan first, wait for approval before implementation.

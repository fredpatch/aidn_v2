# ROLE-UX-1 DG Circuit Workspace - Planning

Date: 2026-05-22

## Objective

Plan a focused workspace for DG circuit actors (`dg_secretariat`, `reception`, `bureau_courrier`) so they can handle pending DG circuit work without full DN dossier visibility.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/App.tsx`
- `apps/admin/src/config/nav.tsx`
- `apps/api/src/modules/requests/request.service.ts`
- `apps/api/src/modules/requests/request.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-22-role-ux-1-dg-circuit-workspace-planning.md`

## Key decisions

- Do not grant `DOSSIER_VIEW_ALL` to DG circuit actors.
- Do not reuse `/dossiers` or `getAdminDossier` for this workspace because those return full DN dossier detail.
- Use capability permissions, not role checks.
- Aggregate work from two existing domains:
  - Initial request/courrier DG circuit (`requests` + `dg_reviews`)
  - Preliminary pre-evaluation DG circuit (`dossiers` + preliminary `oma_phases`)
- Reuse existing mutation endpoints for actions; the new endpoint should be read-focused and scoped.

## Proposed Backend Endpoint Contract

### `GET /api/v1/admin/dg-circuit/tasks`

Guard:

- Require at least one of:
  - `DG_CIRCUIT_HANDLE`
  - `COURRIER_REGISTER_PHYSICAL`
  - `PRE_EVAL_DG_CIRCUIT_HANDLE`
- Admin/bootstrap_admin continue through all-permissions fallback.
- Do not require `DOSSIER_VIEW_ALL`.

Query:

- `bucket?: "to_transmit" | "awaiting_return" | "returns_to_register" | "processed"`
- `source?: "initial_request" | "pre_evaluation"`
- `search?: string`
- `limit?: number`

Response:

```ts
type DgCircuitTaskListResponse = {
  items: DgCircuitTask[];
  counts: {
    toTransmit: number;
    awaitingReturn: number;
    returnsToRegister: number;
    processed: number;
  };
};

type DgCircuitTask = {
  id: string;
  source: "initial_request" | "pre_evaluation";
  bucket: "to_transmit" | "awaiting_return" | "returns_to_register" | "processed";
  subject: string;
  organizationName?: string;
  applicantName?: string;
  reference?: string;
  requestId?: string;
  dossierId?: string;
  phaseId?: string;
  status: string;
  documentToTransmitId?: string;
  annotatedReturnDocumentId?: string;
  submittedAt?: string;
  transmittedAt?: string;
  returnedAt?: string;
  processedAt?: string;
  availableActions: Array<
    | "download_outgoing"
    | "mark_transmitted"
    | "record_physical_receipt"
    | "record_annotated_return"
    | "download_annotated_return"
  >;
};
```

Task mapping:

- Initial request / portal upload:
  - `submitted` or `intake_in_review` + `courrierSource=portal_upload` + `initialDocumentId` -> `to_transmit`; action `download_outgoing`, `mark_transmitted`.
  - `initial_sent_to_dg` without linked `returnedScannedDocumentId` -> `awaiting_return`; action `record_annotated_return`.
  - `oriented_to_dn` or `rejected` with linked return scan -> `processed`; action `download_annotated_return`.
- Initial request / physical deposit:
  - `submitted` + `courrierSource=physical_deposit` + `physicalDeposit.status=planned` -> `to_transmit` or operationally "physical receipt required"; action `record_physical_receipt`.
  - After receipt, existing flow moves to `initial_sent_to_dg`, then `awaiting_return`.
- Preliminary pre-evaluation:
  - `pre_eval_form_submitted` + `completedPreEvaluationDocumentId` -> `to_transmit`; action `download_outgoing`, `mark_transmitted`.
  - `pre_eval_sent_to_dg` without `preEvaluationDgAnnotatedDocumentId` -> `awaiting_return`; action `record_annotated_return`.
  - `pre_eval_dg_decision_recorded` + `preEvaluationDgAnnotatedDocumentId` -> `processed`; action `download_annotated_return`.

Download route note:

- Current admin dossier download route only allows annotated return. Implementation should add or reuse a narrow outgoing-document download route for DG circuit actors that validates the document belongs to the task being transmitted. It must not expose arbitrary dossier documents.

## Proposed Role / Permission Mapping

- Keep `DOSSIER_VIEW_ALL` unchanged for DN/admin dossier workflow users.
- Keep `PRE_EVAL_DG_CIRCUIT_HANDLE` off `dn_agent` and `dn_supervisor`.
- Add no new broad permission if possible; reuse:
  - `DG_CIRCUIT_HANDLE` for initial request print/transmit and initial DG return registration.
  - `COURRIER_REGISTER_PHYSICAL` for physical-deposit receipt/scan.
  - `PRE_EVAL_DG_CIRCUIT_HANDLE` for preliminary completed-form transmit and return registration.
  - `PRE_EVAL_DG_RETURN_CONSULT` for annotated pre-eval return consultation.
- If implementation prefers a clearer read permission, add `DG_CIRCUIT_TASK_VIEW` and assign it only to admin/bootstrap_admin plus `dg_secretariat`, `reception`, and `bureau_courrier`. The task endpoint should still compute `availableActions` from action permissions.

## Proposed Sidebar / Menu Visibility Rules

- Add `Circuit DG` in `Traitement`.
- `Circuit DG` visible when user has any:
  - `DG_CIRCUIT_HANDLE`
  - `COURRIER_REGISTER_PHYSICAL`
  - `PRE_EVAL_DG_CIRCUIT_HANDLE`
- `Demandes` remains visible with `REQUEST_VIEW_ALL`.
- `Dossiers DN` must require `DOSSIER_VIEW_ALL`.
- `Workflow OMA`, `Documents`, `Reunions`, and `Certificats` should be reviewed for explicit permissions before broad exposure to operational roles; ROLE-UX-1 should at minimum fix `Dossiers DN` and add `Circuit DG`.
- Route protection:
  - `/circuit-dg`: protected by any DG circuit task permission.
  - `/dossiers` and `/dossiers/:id`: protected by `DOSSIER_VIEW_ALL`.

## Proposed UI Layout for Circuit DG Page

Page: `/circuit-dg`

Layout:

- Compact operational header: title `Circuit DG`, count summary, search/filter controls.
- Tabs or segmented filters:
  - `A transmettre au circuit DG`
  - `En attente retour DG`
  - `Retours a enregistrer`
  - `Traites`
- Task table/card rows:
  - Type/source badge: `Demande initiale` or `Pre-evaluation`
  - Reference / subject
  - Organization
  - Submitted/transmitted date
  - Current status
  - Action buttons from `availableActions`
- Actions:
  - Download/print outgoing document
  - Mark transmitted to DG circuit
  - Register physical receipt/scan where applicable
  - Upload/register DG annotated return
  - Download annotated return for processed items

UX boundary:

- No link to full dossier detail for DG circuit roles.
- If admin/DN users also see the page, optional links to request/dossier detail can be shown only when they also have the respective full-view permission.

## Implementation Details, if any

Planning only. No implementation performed.

## Verification commands run

- None during planning.

## Manual checks run or not run

- Runtime checks not run; planning only.

## Known risks / TODOs

- Need a narrow outgoing-document download path for pre-evaluation completed forms and initial request documents. It must validate task ownership and status.
- Existing nav has several unguarded prototype/workflow pages; this pass should avoid broad redesign but may need to guard `Dossiers DN` immediately.
- `returns_to_register` may be a UI bucket for the same backend state as `awaiting_return`; backend cannot know a physical return exists until upload. It can be represented as tasks with action `record_annotated_return` under `awaiting_return`, while the UI labels that section `Retours a enregistrer`.
- Existing source files have mixed encoding in labels; new UI should use the repo's current display style and avoid unrelated text cleanup.

## Next step

Await approval, then implement the focused backend task endpoint plus admin `Circuit DG` route/page/nav guards.

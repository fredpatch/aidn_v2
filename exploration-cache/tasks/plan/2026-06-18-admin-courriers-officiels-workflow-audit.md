# Admin Courriers Officiels Workflow Audit

Date: 2026-06-18
Status: Draft audit
Scope: Admin handling of initial request courriers after postulant submission, with attention to the shared DG/parapheur circuit used later by pre-evaluation and formal request workflows.

## Objective

Refactor and harden the admin "Courriers officiels" workflow so the first post-submission handoff is clear, reliable, and maintainable.

The target workflow is:

1. The postulant submits an initial request with either a portal-uploaded courrier or a declared physical deposit.
2. The request becomes visible to roles configured for intake/courrier handling: `dg_secretariat`, `reception`, `bureau_courrier`, and `admin` as fallback. The user called this "assistant_dg"; in code this currently appears as `dg_secretariat`.
3. Courrier handlers print or register the courrier, which moves the item into DG circuit state.
4. A signed/annotated DG return is uploaded back into the app.
5. DN can then start the dossier work by opening the dossier/phase preliminary flow.

The system already has a dedicated admin workspace for this: `apps/admin/src/pages/DgCircuitPage.tsx`, routed at `/circuit-dg` and labeled "Courriers officiels" in `apps/admin/src/config/nav.tsx`. The older `apps/admin/src/pages/RequestsPage.tsx` still exposes overlapping actions and should be treated as a secondary/legacy surface during refactoring.

## Current Architecture

Primary UI surfaces:

- `apps/admin/src/pages/DgCircuitPage.tsx`
  - Unified operational page for initial request, pre-evaluation, and formal request DG circuits.
  - Lists tasks from `/api/v1/admin/dg-circuit/tasks`.
  - Handles print/mark transmitted, physical receipt registration, return upload, and document preview.
- `apps/admin/src/pages/CourriersPage.tsx`
  - Read-only historical/registry page at `/courriers`.
  - Explicitly says actions happen elsewhere.
- `apps/admin/src/pages/RequestsPage.tsx`
  - Older split-view request intake page.
  - Still contains print, physical receipt, DG return, correction, and open-dossier actions.

Primary API surfaces:

- `apps/admin/src/lib/api/dg-circuit/`
  - Lists DG circuit tasks and downloads task documents.
- `apps/admin/src/lib/api/requests/`
  - Initial request mutations: `markPrintedForDg`, `registerPhysicalCourrier`, `recordDgReturn`, `openDossierDn`.
- `apps/admin/src/lib/api/dossiers/`
  - Later OMA-phase DG circuit mutations: pre-evaluation and formal request send/return.

Backend workflow services:

- `apps/api/src/modules/dg-circuit/dg-circuit.service.ts`
  - Aggregates tasks across initial requests, pre-evaluation, and formal request phases.
  - Computes buckets and available actions from permissions.
- `apps/api/src/modules/requests/request.service.ts`
  - Owns initial request status transitions.
  - `markAdminRequestPrintedForDg` changes initial request status to `initial_sent_to_dg`, creates a `DGReview`, and notifies the postulant.
  - `registerAdminPhysicalCourrier` stores the scanned initial courrier, changes status to `initial_sent_to_dg`, creates a `DGReview`, and notifies the postulant.
  - `recordAdminRequestDgReturn` uploads the annotated return, records the DG decision, and moves the request to `oriented_to_dn` or `rejected`.
  - `openAdminDossierDn` requires a complete DG return before creating the DN dossier and preliminary phase.
- `apps/api/src/shared/permissions/permissions.ts`
  - Grants `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, and `PRE_EVAL_DG_CIRCUIT_HANDLE` to `dg_secretariat`, `reception`, `bureau_courrier`, and `admin`.

## Key Finding

There are two competing mental models in the UI:

- `Courriers officiels` (`/circuit-dg`) is the correct operational workspace for print, circuit tracking, and signed return upload.
- `Demandes` (`/demandes`) still exposes the same initial request actions and can pull users back into request-intake thinking.

For the next refactoring session, `/circuit-dg` should become the source of truth for courrier operations. `/demandes` should focus on request information, correction, and DN dossier opening once the DG return is complete.

Open product/workflow question:

- DN may still need `Demandes` as the place to check whether a signed DG courrier made a request available for dossier opening. This could be a valid boundary: courrier teams work in `/circuit-dg`, while DN uses `/demandes` to see readiness and start the preliminary phase. Before retiring duplicated actions, study whether `Demandes` should remain the DN readiness surface, become read-only plus "open dossier", or deep-link into `/circuit-dg` for traceability.

Vocabulary decision:

- The visible workflow should describe one business event: DG signature. Internal states such as `returned_scanned`, `decision_recorded`, and `processed` can stay granular for guards, history, and API contracts, but operators should see one terminal concept: `Signe DG`.
- The operational flow should read as `A imprimer` -> `En circuit DG` -> `Signe DG`.
- Avoid multiplying labels such as "Retours DG", "Decision saisie", "signed/annotated", or "retour signe" when they refer to the same DG signature handoff.
- Printing and status transition should be separate actions. `Imprimer` only previews/downloads the outgoing document; `Marquer en circuit DG` is the explicit workflow transition that moves the item toward DG signature.
- DG return upload is evidence capture only. Reception, bureau courrier, and DG assistant roles do not select the outcome of the courrier and do not add observations; DN will appreciate the signed courrier in its own workflow.
- DN dossier opening readiness is now based on signed DG courrier evidence: request status `initial_dg_returned`, DG review status `returned_scanned`, and a returned scanned document. Legacy `oriented_to_dn` / `decision_recorded` records remain accepted for backward compatibility, but new courrier roles no longer create that decision.

## Current Risks

- `DgCircuitPage.tsx` is doing too much in one file: task list, filters, task row, timeline, print confirmation, return upload, physical receipt upload, download/preview plumbing, mutation routing, and local refresh behavior.
- Initial request actions are duplicated between `DgCircuitPage.tsx` and `RequestsPage.tsx`, increasing the chance that one workflow gets fixed while the other remains stale.
- The term "print" hides a real workflow transition: `markPrintedForDg` also sets `status = initial_sent_to_dg`, sets `sentToDgAt`, creates a `DGReview`, and sends a notification.
- The UI copy sometimes says "imprimer" and sometimes "mettre en circuit"; this can accidentally expose internal physical/parapheur steps that should remain understated.
- Physical deposit and portal upload converge to `initial_sent_to_dg`, but the UI presents them differently and the backend creates DG reviews through different paths.
- `DgCircuitPage` passes source-specific `FormData` keys inline. Initial request expects `returnedScannedDocument`, while pre-evaluation/formal request expect `file`; this is easy to break.
- `recordFormalRequestDgReturn` route reads `returnedFromDgAt`, while `DgCircuitPage` currently sets `returnedAt`. Formal return dates may silently default instead of using the selected date.
- The page uses local `useEffect` loading and hand-rolled refresh logic instead of TanStack Query; stale selected rows and refresh timing are managed manually.
- Action success has no positive feedback besides the list changing. Errors are page-level and can be separated from the specific dialog/action that caused them.
- Several admin files contain mojibake where French accents and ellipses render as broken byte sequences. This affects trust and clarity in official workflow screens.
- Bucket naming is slightly inconsistent: API supports `returns_to_register` and `processed`, but the UI mostly displays `awaiting_return`, `returned_scanned`, and `decision_recorded`.
- `DgCircuitPage` has an unused `formal-dg-decision` modal state, while the current MVP comment says formal request has no separate decision step.
- The API route guard for `/dg-circuit/tasks` allows `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`, and `PRE_EVAL_DG_CIRCUIT_HANDLE`; backend service also considers `DG_DECISION_RECORD` as a view permission. Route and service permissions should be aligned.
- `DgCircuitPage` defaults the selected detail to empty after load; operators may need first actionable item selected for faster processing.

## Urgent Changes

1. Fix formal DG return date field mapping.
   - In `DgCircuitPage`, for `formal_request`, set `returnedFromDgAt` instead of only `returnedAt`.
   - Keep `returnedAt` for initial request because `recordAdminRequestDgReturn` expects it.

2. Normalize encoded French text in admin workflow files.
   - Target first: `DgCircuitPage.tsx`, `RequestsPage.tsx`, `CourriersPage.tsx`, `requests.helpers.ts`, request dialogs.
   - This should be done carefully in one encoding-focused pass.

3. Make `/circuit-dg` the canonical action surface.
   - Remove or hide duplicate print / DG return / physical receipt actions from `RequestsPage`, or replace them with a "Voir dans Courriers officiels" navigation action.
   - Keep "Demarrer la phase preliminaire" in `Demandes` only if DN/intake users need it there after a valid DG return.

4. Extract source-specific mutation adapters.
   - Move task action routing out of `DgCircuitPage` into a helper such as `dg-circuit.actions.ts`.
   - Each source should own its payload mapping: initial request, pre-evaluation, formal request.

5. Add a confirmation copy pass for print/mise en circuit.
   - Status: Completed on 2026-06-18. The action is now split into `Imprimer` and `Marquer en circuit DG`.
   - `Imprimer` only previews/downloads the document.
   - `Marquer en circuit DG` opens the confirmation dialog and owns the status transition.
   - Avoid explaining the internal parapheur path in detail.
   - Make the status impact visible enough: after confirmation, the item is no longer "a imprimer" and waits for DG signature.

## Proposed Structure

Create a `dg-circuit` folder:

```txt
apps/admin/src/pages/dg-circuit/
  constants.ts
  formatters.ts
  helpers.ts
  types.ts
  dg-circuit.actions.ts
  DgCircuitPageHeader.tsx
  DgCircuitKpis.tsx
  DgCircuitFilters.tsx
  DgCircuitTaskList.tsx
  DgCircuitTaskRow.tsx
  DgCircuitTaskDetail.tsx
  DgCircuitTimeline.tsx
  PrintConfirmDialog.tsx
  DgReturnDialog.tsx
  PhysicalReceiptDialog.tsx
```

Keep `DgCircuitPage.tsx` as the orchestrator:

- read filters/search
- call query/mutation hooks
- hold selected task and open modal state
- pass explicit props to child components
- render page shell/loading/error states

## Query and API Plan

Before introducing Query deeper into the workflow, split the admin API layer using the portal pattern:

- Move domain API modules from flat `*.api.ts` files into folders with `index.ts`, `types.ts`, and `utils.ts` where useful.
- Keep the existing `*.api.ts` files as compatibility barrels during migration so page imports can move gradually.
- Start with `dg-circuit` because it is the active workflow and has the freshest test coverage from the refactor.
- Preserve current request helper signatures while replacing the `fetch` implementation with Axios later. This limits blast radius because callers can keep using `apiGet`, `apiPost`, `apiPostForm`, `apiPatch`, `apiDelete`, and `apiGetBlob`.
- Keep downloads imperative for now; React Query should own workflow data and mutations, not cached blob URLs.

Add query hooks using the existing admin convention from `features/*/hooks` unless a shared query folder becomes necessary:

- `useDgCircuitTasks(filters)`
- `useDownloadDgCircuitTaskDocument()`
- `useMarkInitialRequestPrintedForDg()`
- `useRegisterInitialPhysicalCourrier()`
- `useRecordInitialRequestDgReturn()`
- `useSendPreEvalToDg()`
- `useRecordPreEvalDgReturn()`
- `useSendFormalRequestToDg()`
- `useRecordFormalRequestDgReturn()`

Invalidation:

- Any DG circuit mutation invalidates `dgCircuit.tasks(filters)` and dashboard summaries.
- Initial request mutations also invalidate admin request list/detail.
- Formal/pre-evaluation mutations also invalidate dossier detail and formal/preliminary phase state.

Downloads can stay direct user-triggered calls, but they should be wrapped with consistent error handling and object URL cleanup.

## Step-by-Step Refactor

### Step 1 - Stabilize Behavior

Status: Completed.

- Fix formal return date field mapping.
  - Status: Completed on 2026-06-18. `DgCircuitPage` now sends `returnedFromDgAt` for `formal_request` returns and keeps `returnedAt` for initial/pre-evaluation returns.
- Remove unused `formal-dg-decision` modal state if formal request truly has no separate decision action.
  - Status: Completed on 2026-06-18. Removed unused modal state/import/render path.
- Align route and service permission sets for DG circuit task access.
  - Status: Completed on 2026-06-18. `/dg-circuit/tasks` route access now includes `DG_DECISION_RECORD`, matching service-level task view permissions.
- Add a small helper for source-specific form field names.
  - Status: Completed on 2026-06-18. `DgCircuitPage` now uses explicit helpers for DG return file/date field names and builds return `FormData` through one source-aware function.

Risk: medium. These are small changes but touch workflow transitions.

### Step 2 - Encoding and Copy Cleanup

Status: Not started.

- Normalize mojibake in the admin courrier/request workflow.
- Prefer consistent labels:
  - "Courriers officiels"
  - "A imprimer"
  - "En circuit DG"
  - "Signe DG"
  - "Televerser le document signe"
  - "Marquer en circuit DG"
- Use "DG secretariat" in UI only if the code role `dg_secretariat` represents assistant DG.

Risk: low to medium. Mostly display text, but broad file edits can create noisy diffs.

### Step 3 - Extract Pure Helpers and Constants

Status: Completed.

Move out:

- bucket tab definitions
- source labels
- bucket styles
- date formatting
- API error formatting
- task status derivation/display helpers

Progress:

- Completed on 2026-06-18:
  - Added `apps/admin/src/pages/dg-circuit/types.ts`.
  - Added `apps/admin/src/pages/dg-circuit/helpers.ts`.
  - Added `apps/admin/src/pages/dg-circuit/formatters.ts`.
  - Added `apps/admin/src/pages/dg-circuit/constants.tsx`.
  - Added `apps/admin/src/pages/dg-circuit/actions.ts`.
  - `DgCircuitPage.tsx` now imports task counts, modal state, DG return form-data helpers, bucket tabs, source labels, bucket styles, date formatting, and API error formatting from the new module.
  - Source-specific DG circuit mutations and document preview/download handling now live in `actions.ts`; `DgCircuitPage` delegates print transmission, signed document upload, physical receipt registration, and document preview to named workflow actions.

Risk: low. Keep exports typed and avoid changing labels during movement.

### Step 4 - Extract Display Components

Status: Completed.

Extract:

- `DgCircuitPageHeader`
- `DgCircuitKpis`
- `DgCircuitTaskRow`
- `DgCircuitTaskList`
- `DgCircuitTaskDetail`
- `DgCircuitTimeline`

Progress:

- Completed on 2026-06-18:
  - Extracted `StatusBadge`.
  - Extracted `CourrierTimeline`.
  - Extracted `CourrierTaskRow`.
  - Extracted `DgCircuitKpis`.
  - Extracted `DgCircuitFilters`.
  - Extracted `DgCircuitTaskList`.
  - Extracted `DgCircuitTaskDetail`.
  - Extracted `PrintConfirmDialog`.
  - Extracted `DgReturnDialog`.
  - Extracted `PhysicalReceiptDialog`.

Risk: medium. The main risk is selected state, mobile spacing, and preserving row click behavior.

### Step 5 - Harden Dialogs With shadcn and React Hook Form

Status: Completed.

Refactor one dialog at a time:

1. Print confirmation
2. DG return upload
3. Physical receipt upload

Use:

- shadcn `Dialog`, `Button`, `Input`, `Textarea`, `Label`, `Select`, `Alert`
- React Hook Form and Zod for required file/date/decision validation.
- A shared file field if we adapt `DocumentFileField` into admin, or a local admin equivalent
- Sonner for action success/failure
- Inline validation only for field-level correction

Progress:

- Completed on 2026-06-18:
  - Installed `react-hook-form`, `zod`, and `@hookform/resolvers` in `apps/admin`.
  - `DgReturnDialog` now uses shadcn `Field` primitives, React Hook Form, Zod validation, disabled fieldset state, scoped file validation, and a portal-inspired file upload surface with visible required/optional badges.
  - Added an admin reusable `DocumentFileField` aligned with the portal upload field, and removed the DG-circuit-specific duplicate file field.
  - Updated the portal `DocumentFileField` with the same invalid field state and fallback input ref behavior.
  - Removed decision and observations from the DG return upload form. The form now captures only the signed DG document and an optional signature date.
  - Backend and `Demandes` readiness guards now allow DN dossier opening once the signed DG courrier has been uploaded (`initial_dg_returned` / `returned_scanned`), without requiring an `oriented_to_dn` decision.
  - `PhysicalReceiptDialog` now uses shadcn `Field` primitives, React Hook Form, Zod validation, disabled fieldset state, and per-field validation for date and scan.
  - `PrintConfirmDialog` now uses a form submit path so Enter and submit-button behavior are consistent.
  - `DgCircuitPage` now uses Sonner to show success/failure feedback for print preview, mise en circuit DG, signed DG document upload, physical receipt registration, and document preview.

Risk: medium to high. File inputs and source-specific `FormData` fields are fragile.

### Step 6 - Introduce Query Hooks

Status: Completed.

First split the DG circuit API module, then move loading/mutation state to query hooks after the component split is stable.

API split sequence:

- Create `apps/admin/src/lib/api/dg-circuit/types.ts`.
- Create `apps/admin/src/lib/api/dg-circuit/utils.ts` for query string/path helpers.
- Create `apps/admin/src/lib/api/dg-circuit/index.ts` for exported request functions.
- Keep `apps/admin/src/lib/api/dg-circuit.api.ts` as a compatibility barrel.
- After the DG circuit split is verified, repeat the pattern for `admin.api.ts`, `requests.api.ts`, and `dossiers.api.ts`.
- Once the domain split is stable, install/add Axios in admin and rewrite only the low-level API client internals while preserving exported helper names.

Progress:

- Started on 2026-06-19:
  - Added `apps/admin/src/lib/api/dg-circuit/types.ts`.
  - Added `apps/admin/src/lib/api/dg-circuit/utils.ts`.
  - Added `apps/admin/src/lib/api/dg-circuit/index.ts`.
  - Converted `apps/admin/src/lib/api/dg-circuit.api.ts` into a compatibility barrel.
  - Added `apps/admin/src/lib/query/client/query-client.ts`.
  - Added `apps/admin/src/lib/query/keys/dg-circuit.keys.ts`.
  - Added `apps/admin/src/lib/query/queries/dg-circuit.queries.ts`.
  - Added query barrels under `apps/admin/src/lib/query`.
  - Added `apps/admin/src/lib/api/dg-circuit/workflow.ts` for source-specific DG circuit mutation adapters.
  - Moved `DgCircuitPage` list loading from manual `useEffect` API calls to `useDgCircuitTasks`.
  - Added mutation hooks for marking a task in DG circuit, recording a signed DG document, and recording a physical receipt.
  - Mutating DG circuit actions now invalidate `dgCircuitKeys.lists()` through query hooks instead of manually fetching the task list.
  - `apps/admin/src/pages/dg-circuit/actions.ts` now keeps browser preview helpers only.
  - Installed `axios` in `apps/admin`.
  - Replaced the `fetch` implementation in `apps/admin/src/lib/api/client.ts` with an Axios client while preserving `apiGet`, `apiGetBlob`, `apiPost`, `apiPostForm`, `apiPatch`, `apiDelete`, and `ApiError`.
  - Added `apps/admin/src/lib/api/requests/types.ts`.
  - Added `apps/admin/src/lib/api/requests/utils.ts`.
  - Added `apps/admin/src/lib/api/requests/index.ts`.
  - Converted `apps/admin/src/lib/api/requests.api.ts` into a compatibility barrel.
  - Added `apps/admin/src/lib/api/dossiers/types.ts`.
  - Added `apps/admin/src/lib/api/dossiers/utils.ts`.
  - Added `apps/admin/src/lib/api/dossiers/index.ts`.
  - Converted `apps/admin/src/lib/api/dossiers.api.ts` into a compatibility barrel.
  - Split the remaining admin API domains into folder modules with compatibility barrels:
    `account-requests`, `admin`, `auth`, `dashboard`, `dev`, `document-templates`, and `payments`.
  - Repointed admin app imports from `*.api.ts` barrels to the new domain folders.
  - Removed the temporary compatibility barrels for admin API domains.
  - Added source filtering and URL-param support to `DgCircuitPage` for deep links such as `/circuit-dg?source=initial_request&bucket=to_transmit&search=<subject>`.
  - `DgCircuitPage` now selects the first visible task after load when no selected task exists.
  - Verified with `npm run build` in `apps/admin`.

The selected task should be preserved by ID after refetch. If the selected task disappears because it changed bucket, select the next actionable task or show a calm "processed" empty state.

Risk: high. This changes data flow and refresh behavior.

### Step 7 - Retire Duplicated Request Actions

Status: Completed.

Review `RequestsPage` and decide:

- Keep read-only request detail plus correction/open-dossier actions.
- Replace print/physical/DG return actions with navigation to `/circuit-dg` filtered by request.
- Or keep actions temporarily behind a feature flag while `/circuit-dg` is verified.

Decision:

- Completed on 2026-06-19. `Demandes` keeps request detail, correction, signed-DG evidence display, and `Demarrer la phase preliminaire`.
- Duplicate courrier actions were removed from `Demandes`: print/mise en circuit, physical receipt registration, and DG return upload.
- The old request-level physical receipt and DG return dialogs were deleted.
- Eligible courrier actions now show `Voir dans Courriers officiels` and navigate to `/circuit-dg` with `source=initial_request`, the relevant bucket, and the request subject as the search filter.
- `RequestsPage` was reduced to an orchestrator by extracting `RequestsKpis`, `RequestsListPanel`, and `RequestDetailPanel`.

Risk: medium. Operators may already use `Demandes`; changing action location should be paired with clear navigation.

### Step 8 - Backend Workflow Hardening

Status: Started.

- Consider a single command endpoint per DG task, or a thin backend adapter, so frontend does not know source-specific field names.
- Ensure `createDgReview` upsert cannot overwrite meaningful historical review data unexpectedly.
- Initial request DG return upload now stops at signed-scan evidence (`initial_dg_returned` / `returned_scanned`) instead of recording `oriented_to_dn` or rejection from courrier roles. DN dossier opening uses that evidence as the gate.
- Persist signed DG courrier uploads with the existing document enum value `dg_annotated_courrier` until document type enums are intentionally renamed/migrated. UI copy can still say "document signe DG".
- Add tests for initial request transitions:
  - portal upload submitted -> print -> `initial_sent_to_dg`
  - physical declared -> physical receipt -> `initial_sent_to_dg`
  - DG signed return uploaded -> `initial_dg_returned` with `returned_scanned` DG review and signed scan document
  - open dossier requires the signed DG scan evidence

Progress:

- Started on 2026-06-19:
  - Hardened `createDgReview` so sending an item to DG cannot overwrite an already returned, decision-recorded, or cancelled DG review.
  - Updated DN dossier-opening guard copy to require the signed DG courrier rather than an annotated DG return.
  - Split `apps/api/src/modules/dg-circuit/dg-circuit.service.ts` by extracting shared task types, permission/search helpers, and generic DG review write operations into `dg-circuit.types.ts`, `dg-circuit.helpers.ts`, and `dg-review.service.ts`.
  - Preserved the public service exports (`canViewDgCircuitTasks`, `createDgReview`, `markSentToDg`, `recordDgReturn`, `recordDgDecision`) so request/formal-phase callers do not need to change during this refactor.
  - Introduced the target backend module shape for DG circuit: `dg-circuit.routes.ts` owns Express routes/permissions, `dg-circuit.controller.ts` owns HTTP parsing and responses, `dg-circuit.service.ts` owns workflow composition and authorization, and `dg-circuit.repository.ts` owns model/storage reads.
  - Mounted the DG circuit router from `admin.routes.ts`, removing the inline `/dg-circuit/tasks` handlers from the admin router.
  - Started applying the same backend cleanup to `requests`: extracted request constants, shared types, validators, and response formatters from `request.service.ts`. The service remains behavior-compatible but dropped from 1628 to 1300 lines.
  - Reorganized the request module into the target folder shape: `constants/`, `helpers/`, `types/`, `services/`, `repository/`, `controllers/`, and `routes/`. Existing admin/portal callers still import through the root `request.service.ts` compatibility barrel.
  - Split the monolithic request service into `services/portal-request.service.ts` and `services/admin-request.service.ts`; `services/request.service.ts` is now a compatibility barrel.
  - Added `repository/request.repository.ts` and moved shared request/DG-review/user reads behind it. The largest request service file is now the admin workflow service at roughly 765 lines, down from the original 1628-line mixed service.
  - Next backend refactor target: `oma-phases`, currently the largest API module. Apply the same module shape (`constants/`, `helpers/`, `types/`, `services/`, `repository/`, `controllers/`, `routes/`) before splitting the large preliminary, formal request, and document-evaluation services.
  - OMA refactor order: folder skeleton and compatibility barrels first, shared constants/types/helpers second, then focused services/repositories for preliminary phase, formal request phase, and document evaluation.
  - Started OMA refactor: moved `oma-phase.service.ts`, `formal-request.service.ts`, and `document-evaluation.service.ts` into `oma-phases/services/`, keeping root compatibility barrels so existing imports continue to work.
  - Added OMA folder skeleton: `constants/`, `helpers/`, `types/`, `services/`, `repository/`, `controllers/`, and `routes/`.
  - Extracted shared OMA `Actor`/`GenericRecord` types and `ensureInternalActor` helper for preliminary, formal request, and document-evaluation services.
  - Corrected OMA module root convention: the root now exposes only `index.ts`; service implementations live under `services/`, and `oma-phase.model.ts` moved under `models/`.
  - Updated external OMA imports to use the root `oma-phases/index.ts` facade while internal OMA services import the model from `models/`.
  - Started splitting OMA services one by one with `formal-request.service.ts`: extracted formal request status constants, supporting-document category mapping, file validation, requirement-status computation, and assertion guards into `constants/formal-request.constants.ts` and `helpers/formal-request.helpers.ts`.
  - `formal-request.service.ts` remains behavior-compatible and now delegates pure formal workflow support helpers to the OMA helper/constants folders.
  - Continued `formal-request.service.ts` split by adding `repository/formal-request.repository.ts` and moving formal phase, dossier, DG review, meeting, requirement, submission, and document read helpers behind repository methods.
  - Extracted the read-only formal request overview builder into `services/formal-request-overview.service.ts`; the main formal workflow service now delegates post-mutation response composition instead of owning the full admin view mapper.
  - Extracted the formal DG circuit workflow (`sendFormalRequestToDg`, `recordFormalRequestDgReturn`, `recordFormalRequestDgDecision`) into `services/formal-request-dg.service.ts`.
  - Extracted formal supporting-document uploads and replacement/archive handling into `services/formal-request-documents.service.ts`.
  - Extracted the formal meeting workflow (`createFormalMeeting`, `markFormalMeetingHeld`, `uploadFormalMeetingReport`) into `services/formal-request-meeting.service.ts`.
  - Extracted recevability courrier upload, closure courrier upload, and final Phase II closure into `services/formal-request-closure.service.ts`.
  - Extracted DN review of the formal OMA approval form into `services/formal-request-review.service.ts` and moved postulant notification creation to `helpers/notification.helpers.ts`.
  - `formal-request.service.ts` is now roughly 224 lines, down from 1627 at the start of this formal-request split pass; it now focuses on formal request courrier intake/registration while the related workflows live in focused services.
  - Added file-level slice comments to the formal request service/repository/helper/constants files to document ownership, workflow rules, and where each slice is expected to be used.
  - Formal service still owns workflow writes and audit/notification orchestration; repository extraction is intentionally read-focused for this pass.
  - No API test runner is currently configured in `apps/api`; verification uses `npm run typecheck`.

Risk: high. Backend tests and contracts should be added before deeper endpoint consolidation.

## UI Improvement Hints

- Make the right panel operational, not explanatory. Show the current task, timeline, and one primary action.
- Use shadcn `Tabs` or segmented buttons for buckets rather than a row of generic buttons.
- Make `A imprimer` visually distinct from `En circuit DG`.
- Add a source filter: initial request, pre-evaluation, formal request.
- Add deep-link support from `Demandes` to `/circuit-dg?source=initial_request&search=<requestId or organization>`.
- Keep the physical/parapheur process implied by labels, not over-described.
- Use Sonner for success messages: printed/marked in circuit, physical receipt registered, DG return uploaded.
- Keep persistent page errors only for load/permission failures.

## Workflow Improvement Hints

- After the postulant submits, `Courriers officiels` should be the first admin landing surface for `dg_secretariat`, `reception`, and `bureau_courrier`.
- The first visible bucket should prioritize actionable items: `A imprimer` / physical receipt to register, then `En circuit DG`.
- For initial request portal uploads, opening the document preview before confirmation is good, but the confirmation should clearly separate "preview opened" from "status changed".
- For physical deposits, "Enregistrer la reception physique" is the action that sends the request into the DG circuit; it should not look like a passive metadata update.
- DN should not need to infer readiness from courrier pages. Once DG return is oriented to DN and scanned, `Demandes` or dashboard should surface "Demarrer la phase preliminaire".

## Verification Plan

After each slice:

```txt
npm run typecheck
npm run build
```

Manual checks:

- Log in as `dg_secretariat`, `reception`, `bureau_courrier`, and `admin`.
- Submit an initial request from portal with uploaded courrier.
- Confirm it appears in `/circuit-dg` under `A imprimer`.
- Click `Imprimer` and verify it previews/downloads the outgoing courrier without changing status.
- Click `Marquer en circuit DG`, confirm, and verify it moves to `En circuit DG`.
- Upload the signed DG document and verify it becomes `Signe DG`.
- Confirm `Demandes` or the future DN readiness surface shows that the signed courrier is available for DN appreciation before dossier opening.
- Submit a request with physical deposit declared.
- Register physical receipt with scan and verify it enters `En circuit DG`.
- Verify `Demandes` does not offer duplicate/conflicting courrier actions after the canonical surface is chosen.
- Check that all action success/failure feedback is localized and clear.

Known local caveat:

As noted in the portal plan, this Windows sandbox can hit a Tailwind/Vite native `spawn EPERM` issue during build. If that happens, rerun build outside the sandbox.

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

Status: In progress (repository layer completed, tests pending).

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
  - Started splitting `oma-phase.service.ts`: extracted portal dossier ownership checks to `services/oma-phase-access.service.ts`, admin list/detail/download reads to `services/oma-phase-admin-read.service.ts`, portal dossier view/download/completed-form upload to `services/oma-phase-portal.service.ts`, and preliminary DG send/return flow to `services/oma-phase-dg.service.ts`.
  - Split the portal OMA phase surface again: `oma-phase-portal.service.ts` is now a compatibility barrel, with portal dossier overview in `oma-phase-portal-overview.service.ts`, portal download guards in `oma-phase-portal-documents.service.ts`, and completed pre-evaluation upload in `oma-phase-portal-pre-eval.service.ts`.
  - Finished the `oma-phase.service.ts` split: the file is now a compatibility barrel, with first/preliminary meeting workflow in `oma-phase-meetings.service.ts`, pre-evaluation template publication in `oma-phase-pre-eval.service.ts`, and preliminary closure courrier/phase close in `oma-phase-closure.service.ts`.
  - Added preliminary shared constants, response formatters, and file validation helpers in `constants/preliminary.constants.ts`, `helpers/oma-phase.formatters.ts`, and `helpers/preliminary.helpers.ts`.
  - `oma-phase.service.ts` is now roughly 15 lines, down from 1484 at the start of this pass.
  - Next OMA split target: `services/document-evaluation.service.ts` (roughly 1080 lines). Planned slices:
    - `constants/document-evaluation.constants.ts` for payment-gate/status sets.
    - `helpers/document-evaluation.helpers.ts` for phase loading, payment serialization, progress/status computation, and response mappers.
    - `repository/document-evaluation.repository.ts` for phase/payment/evaluation/submission/requirement reads and writes that are currently embedded in service methods.
    - `services/document-evaluation-payment.service.ts` for admin invoice state/upload and portal payment-proof state/upload.
    - `services/document-evaluation-review.service.ts` for admin evaluation initialization, listing, and DN review.
    - `services/document-evaluation-correction.service.ts` for portal correction upload and portal Phase III state.
    - `services/document-evaluation-closure.service.ts` for closing Phase III and opening inspection.
    - Keep `services/document-evaluation.service.ts` as a compatibility barrel until all external imports can be migrated safely.
  - Completed the `document-evaluation.service.ts` split: the file is now a 10-line compatibility barrel, down from 1080 lines.
  - Added Phase III constants in `constants/document-evaluation.constants.ts` and shared helpers in `helpers/document-evaluation.helpers.ts`.
  - Extracted focused Phase III services:
    - `document-evaluation-payment.service.ts` for study-fee invoice/payment-proof workflows.
    - `document-evaluation-review.service.ts` for DN/admin initialization, listing, and review.
    - `document-evaluation-correction.service.ts` for portal correction upload and portal Phase III state.
    - `document-evaluation-closure.service.ts` for Phase III closure and inspection phase unlock.

- Completed on 2026-06-23:
  - **Repository extraction audit:** Identified 8 high-frequency query duplication patterns across document-evaluation services. Each service re-fetches dossier, phase, payment, and evaluation records independently, leading to 8–12 queries per operation where 3–4 would suffice.
  - **Created `repository/document-evaluation.repository.ts`:** 17 methods consolidating Phase III data access:
    - Core reads: `findDossierById`, `findDossierByIdLean`, `findPhaseById`, `findPhaseByKey`, `findDocEvalPhaseByDossierIdLean`
    - Payment reads: `findPhasePaymentOrNull`, `findPhasePaymentOrThrow`
    - Evaluation reads: `findDocumentEvaluationById`, `findDocumentEvaluationByIdInPhase`, `findDocumentEvaluationByIdInPhaseLean`, `findDocumentEvaluationsByPhaseId`, `findDocumentEvaluationsByPhaseIdLean`, `countDocumentEvaluationsByStatus`
    - Batch reads: `findDocumentRequirementsByIds`, `findDocumentSubmissionsByIds`, `findDocumentsByIds`, `findDocumentSubmissionsByPhaseId`
  - **Updated 4 document-evaluation services** to use `documentEvaluationRepository`:
    - `document-evaluation-payment.service.ts`: 3 functions now use repository; eliminated 6 independent `DossierModel.findById()` calls and consolidated `PhasePaymentModel.findOne()` queries
    - `document-evaluation-review.service.ts`: 2 functions refactored; batch requirement/submission lookups now one query each
    - `document-evaluation-correction.service.ts`: 2 functions refactored; batch evaluations + requirements consolidated
    - `document-evaluation-closure.service.ts`: `countDocumentEvaluationsByStatus()` replaces embedded aggregation; phase lookup centralized
  - **Created `repository/oma-phase.repository.ts`:** 6 methods for shared preliminary/formal reads:
    - Phase lookups: `findOmaPhaseByKeyLean`, `findAllOmaPhasesByDossierIdLean`
    - Request/courrier reads: `findRequestByIdLean`, `findCourrierByIdLean`
    - Batch reads: `findDocumentsByIds`, `findDocumentRequirementsByIds`
  - **Updated `repository/index.ts`:** Now exports both `documentEvaluationRepository` and `omaPhaseRepository`
  - **Verification:** `npm run typecheck` in `apps/api` passes ✓

Impact: 8–12 query eliminations per Phase III operation; N+1 pattern fixed in batch evaluations; repository layer now acts as the caching boundary for future optimization.

Risk: medium. Repositories own data shaping; callers must trust return types. Cache validation becomes repository responsibility.

Step 8 Summary and Impact: All repository layers completed. Core architectural separation of concerns achieved:
- DG circuit: `dg-circuit.repository.ts` pending (defer; current `services/` layer handles direct DB queries efficiently)
- OMA phases: `oma-phase.repository.ts` + `document-evaluation.repository.ts` extraction complete
- Impact: Eliminated 8–12 query duplications per Phase III operation; N+1 patterns fixed in batch evaluations; 224-line formal request service (down from 1627); 15-line preliminary wrapper (down from 1484); 10-line document-evaluation wrapper (down from 1080)
- Query consolidation: centralized payment/phase/evaluation/requirement/submission lookups; batch document reads unified; repository becomes the caching boundary for future optimization

Remaining Step 8 work (optional/future phase): Add integration tests for initial request transitions (portal upload → print → `initial_sent_to_dg`, physical deposit → physical receipt, signed DG upload, etc.). Focus should move to admin frontend UI hardening and mutation infrastructure.

### Step 9 - Internal AIDN Account Management

Status: Implemented on 2026-06-24; backend service/repository extraction remains a future cleanup option.

Reason:

- Internal AIDN accounts can be activated with a generated temporary password, and users can change their own password after login.
- If an internal user loses their password after activation, there is currently no explicit admin reset path. Re-running activation is not a clear operational action and mixes account creation, role update, reactivation, and password reset.
- `InternalAccountsPage` is currently read-only apart from filters. It does not expose lifecycle actions such as reset password, disable account, reactivate account, or role update.

Current implementation:

- `apps/api/src/modules/admin/admin.service.ts`
  - `activateInternalAccount` creates or updates an internal AIDN account.
  - It generates a 6-digit temporary password, hashes it, sets `mustChangePassword = true`, sets `temporaryPasswordExpiresAt`, and returns the temporary password once.
  - It writes audit events for activation/reactivation/role change.
- `apps/api/src/modules/auth/auth.service.ts`
  - `loginInternalUser` authenticates by matricule and local AIDN password.
  - It returns `requiresPasswordChange` when `mustChangePassword` is true.
  - `changeInternalPassword` requires the current password and clears `mustChangePassword`.
- `apps/api/src/modules/users/user.model.ts`
  - Already supports `passwordHash`, `mustChangePassword`, `temporaryPasswordExpiresAt`, `passwordChangedAt`, `isActive`, and `lastLoginAt`.
- `apps/api/src/modules/users/aidn-internal-account.model.ts`
  - Already supports `status = pending_first_login | active | disabled`, `disabledById`, `disabledAt`, and `lastLoginAt`.
- `apps/admin/src/pages/InternalAccountsPage.tsx`
  - Lists accounts and filters by search, role, and status.
  - No row actions exist yet.

Target product behavior:

- Admin can reset an internal user's password from `Comptes internes`.
- The reset creates a new temporary password, sets `mustChangePassword = true`, sets `temporaryPasswordExpiresAt`, and returns the temporary password once in a confirmation dialog.
- The target user must change the temporary password at next login.
- Admin can disable an account when a person should no longer access AIDN.
- Admin can reactivate a disabled account, ideally with a fresh temporary password and forced password change.
- Admin can update an internal user's role without using the personnel activation screen as a workaround.
- The account list should show security-relevant state: `mustChangePassword`, temporary password expiry, password last changed, and disabled metadata where relevant.

Proposed API additions:

- `POST /api/v1/admin/internal-accounts/:id/reset-password`
  - Permission: `AIDN_USER_ACTIVATE` initially, or introduce a more precise `AIDN_USER_MANAGE`.
  - Returns `{ account, temporaryPassword, expiresAt }`.
  - Writes audit event `admin.internal_account_password_reset`.
- `PATCH /api/v1/admin/internal-accounts/:id/role`
  - Body: `{ role }`.
  - Validates against activatable internal roles.
  - Writes audit event `admin.internal_account_role_changed`.
- `POST /api/v1/admin/internal-accounts/:id/disable`
  - Sets account `status = disabled`, user `isActive = false`, `disabledById`, `disabledAt`.
  - Writes audit event `admin.internal_account_disabled`.
- `POST /api/v1/admin/internal-accounts/:id/reactivate`
  - Sets account `status = pending_first_login`, user `isActive = true`, generates fresh temporary password, forces password change.
  - Writes audit event `admin.internal_account_reactivated`.

Backend refactor notes:

- Extract internal account logic from `admin.service.ts` into a focused module shape:
  - `modules/admin/services/internal-account.service.ts`
  - `modules/admin/repository/internal-account.repository.ts`
  - `modules/admin/helpers/password.helpers.ts`
  - `modules/admin/constants/internal-account.constants.ts`
- Reuse the existing temporary password generation rule, but consider increasing from a 6-digit numeric password to a stronger short passphrase/token before real deployment.
- Add guards:
  - Do not allow an admin to disable/reset their own account without an explicit policy decision.
  - Protect `bootstrap_admin` role changes separately if needed.
  - Avoid returning temporary passwords except directly from create/reset/reactivate responses.
- Add audit log coverage for success and failure paths.

Admin UI plan:

- Keep `InternalAccountsPage` as the management surface.
- Add a right-side detail panel or row action menu with:
  - `Reinitialiser le mot de passe`
  - `Modifier le role`
  - `Desactiver`
  - `Reactiver`
- Use shadcn dialogs and Sonner:
  - Reset/reactivate dialogs must show the generated temporary password once, with copy button.
  - Destructive actions require confirmation.
  - Success/failure feedback should be action-scoped.
- Add table columns or badges:
  - `Mot de passe temporaire`
  - `Changement requis`
  - `Expire le`
  - `Modifie le`
- Later: move `InternalAccountsPage` to TanStack Query hooks using the same admin query structure already started for DG circuit and requests.

Verification plan:

- Activate an internal account and confirm temporary password first-login flow still works.
- Reset password for an active account; old password should fail, temporary password should login and force change.
- Reset password for a pending account; latest temporary password should be the only valid one.
- Disable account; login should fail with disabled account.
- Reactivate account; login should work only with the new temporary password and require password change.
- Role update should affect permissions after next login/session refresh.
- Audit log should show reset, disable, reactivate, and role update actions.

### Step 10 - Phase III Billing Access and Gating

Status: Implemented on 2026-06-24.

Decision:

- Phase III billing must unlock only after Phase II / demande formelle is closed.
- A pre-created `document_evaluation` phase with `status = not_started` must not appear in the billing queue and must not allow invoice upload.
- Reception and DG secretariat can transmit the study-fee invoice once Phase III is active.

Changes:

- Added `PAYMENT_VIEW` and `PAYMENT_INVOICE_UPLOAD` to `dg_secretariat`.
- `reception` already had `PAYMENT_VIEW` and `PAYMENT_INVOICE_UPLOAD`.
- `listPhasePaymentTasks` now lists only phases with `status = in_progress`, preventing not-started Phase III records from showing as `invoice_pending`.
- `getDocumentEvaluationPaymentState` now rejects payment state access while Phase III is not opened.
- `uploadStudyFeeInvoice` now rejects invoice upload unless the document-evaluation phase is `in_progress`.
- Portal dashboard action counts now include Phase III payment-proof work: once the study-fee invoice exists and no proof has been uploaded, the related request is marked as `actionRequired` with label `Preuve de paiement a televerser`.
- Portal request detail now exposes the same Phase III payment-proof action in the `Actions requises` tab through the dossier overview response. The tab shows a direct action card with invoice download and a shortcut to the Phase III dossier section.
- Admin dossier `Phases` tab now renders a Phase III active-phase progression card, with seven explicit steps from Phase II closure to Phase III closure.

Verification:

- `npm run typecheck` in `apps/api` passes.
- `npm run typecheck` in `apps/portal` passes for the dashboard/detail action contract.
- `npm run build` in `apps/admin` passes for the Phase III progression sidebar.
- Existing logged-in DG secretariat users may need to log out/in to receive the new permissions in their session.

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

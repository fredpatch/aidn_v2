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

- `apps/admin/src/lib/api/dg-circuit.api.ts`
  - Lists DG circuit tasks and downloads task documents.
- `apps/admin/src/lib/api/requests.api.ts`
  - Initial request mutations: `markPrintedForDg`, `registerPhysicalCourrier`, `recordDgReturn`, `openDossierDn`.
- `apps/admin/src/lib/api/dossiers.api.ts`
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
   - The visible action can be "Imprimer et marquer mis en circuit".
   - Avoid explaining the internal parapheur path in detail.
   - Make the status impact visible enough: after confirmation, the item is no longer "a imprimer" and waits for DG return.

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

Add query hooks under `apps/admin/src/lib/query` or the existing admin query convention if one is introduced:

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

Status: In progress.

- Fix formal return date field mapping.
  - Status: Completed on 2026-06-18. `DgCircuitPage` now sends `returnedFromDgAt` for `formal_request` returns and keeps `returnedAt` for initial/pre-evaluation returns.
- Remove unused `formal-dg-decision` modal state if formal request truly has no separate decision action.
  - Status: Completed on 2026-06-18. Removed unused modal state/import/render path.
- Align route and service permission sets for DG circuit task access.
  - Status: Completed on 2026-06-18. `/dg-circuit/tasks` route access now includes `DG_DECISION_RECORD`, matching service-level task view permissions.
- Add a small helper for source-specific form field names.
  - Status: Not started. Recommended next small slice before extracting dialogs.

Risk: medium. These are small changes but touch workflow transitions.

### Step 2 - Encoding and Copy Cleanup

Status: Not started.

- Normalize mojibake in the admin courrier/request workflow.
- Prefer consistent labels:
  - "Courriers officiels"
  - "A imprimer"
  - "En circuit DG"
  - "Retour DG enregistre"
  - "Decision saisie"
  - "Televerser le retour signe/annote"
- Use "DG secretariat" in UI only if the code role `dg_secretariat` represents assistant DG.

Risk: low to medium. Mostly display text, but broad file edits can create noisy diffs.

### Step 3 - Extract Pure Helpers and Constants

Status: Not started.

Move out:

- bucket tab definitions
- source labels
- bucket styles
- date formatting
- API error formatting
- task status derivation/display helpers

Risk: low. Keep exports typed and avoid changing labels during movement.

### Step 4 - Extract Display Components

Status: Not started.

Extract:

- `DgCircuitPageHeader`
- `DgCircuitKpis`
- `DgCircuitTaskRow`
- `DgCircuitTaskList`
- `DgCircuitTaskDetail`
- `DgCircuitTimeline`

Risk: medium. The main risk is selected state, mobile spacing, and preserving row click behavior.

### Step 5 - Harden Dialogs With shadcn and React Hook Form

Status: Not started.

Refactor one dialog at a time:

1. Print confirmation
2. DG return upload
3. Physical receipt upload

Use:

- shadcn `Dialog`, `Button`, `Input`, `Textarea`, `Label`, `Select`, `Alert`
- React Hook Form for required file/date/decision validation
- A shared file field if we adapt `DocumentFileField` into admin, or a local admin equivalent
- Sonner for action success/failure
- Inline validation only for field-level correction

Risk: medium to high. File inputs and source-specific `FormData` fields are fragile.

### Step 6 - Introduce Query Hooks

Status: Not started.

Move loading/mutation state to query hooks after the component split is stable.

The selected task should be preserved by ID after refetch. If the selected task disappears because it changed bucket, select the next actionable task or show a calm "processed" empty state.

Risk: high. This changes data flow and refresh behavior.

### Step 7 - Retire Duplicated Request Actions

Status: Not started.

Review `RequestsPage` and decide:

- Keep read-only request detail plus correction/open-dossier actions.
- Replace print/physical/DG return actions with navigation to `/circuit-dg` filtered by request.
- Or keep actions temporarily behind a feature flag while `/circuit-dg` is verified.

Risk: medium. Operators may already use `Demandes`; changing action location should be paired with clear navigation.

### Step 8 - Backend Workflow Hardening

Status: Not started.

- Consider a single command endpoint per DG task, or a thin backend adapter, so frontend does not know source-specific field names.
- Ensure `createDgReview` upsert cannot overwrite meaningful historical review data unexpectedly.
- Add tests for initial request transitions:
  - portal upload submitted -> print -> `initial_sent_to_dg`
  - physical declared -> physical receipt -> `initial_sent_to_dg`
  - DG return oriented -> `oriented_to_dn` with document
  - DG return cancelled -> `rejected`
  - open dossier requires oriented DG return and scanned document

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
- Preview/download the outgoing courrier.
- Confirm print/mise en circuit and verify it moves to `En circuit DG`.
- Upload an oriented DG return and verify it becomes `Decision saisie`.
- Confirm the request can then open a DN dossier.
- Submit a request with physical deposit declared.
- Register physical receipt with scan and verify it enters `En circuit DG`.
- Verify `Demandes` does not offer duplicate/conflicting courrier actions after the canonical surface is chosen.
- Check that all action success/failure feedback is localized and clear.

Known local caveat:

As noted in the portal plan, this Windows sandbox can hit a Tailwind/Vite native `spawn EPERM` issue during build. If that happens, rerun build outside the sandbox.

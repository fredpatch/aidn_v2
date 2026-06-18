# Request Detail Workflow Refactor Plan

Date: 2026-06-17
Status: In progress
Scope: Portal request creation, request consultation, and cleanup of `RequestDetailPage.tsx`

## Objective

Refactor `apps/portal/src/pages/RequestDetailPage.tsx` into smaller workflow-focused pieces while preserving current behavior. The target is a detail page that is easier to read, safer to modify, and visually clearer for a postulant consulting or completing a request.

The current component is doing too much at the same level: data loading, tab routing, request editing, courrier submission, dossier consultation, preliminary phase uploads, formal request uploads, downloads, status guidance, local notices, and several embedded UI components. That makes the workflow difficult to reason about and increases the risk of breaking one phase while touching another.

## Current Risks

- The page is about 1850 lines, so unrelated workflows are visually and logically mixed together.
- Local state is spread across the component for request data, dossier data, upload state, expanded requirement state, errors, selected tabs, and form values.
- API calls are made directly in the page instead of through query hooks, which makes loading, retry, invalidation, and stale data harder to control.
- Some success/error messages are persistent inline notices that stay on screen after the action is done; they should become Sonner notifications when they are action feedback.
- Some inline notices are actually workflow guidance and should remain visible, but they need better visual hierarchy.
- Upload and download handlers are shared across distant UI sections, which makes it easy to connect the wrong error state to the wrong form.
- Multiple forms still use plain HTML controls and custom `btn`/`control` classes instead of the shadcn component set now used elsewhere.
- The page mixes request-level workflow and dossier-level workflow, even though the user thinks in steps: create request, submit courrier, follow dossier, complete required actions.

## Guiding Principles

- Move in small slices and typecheck after each one.
- Do not change backend contracts during the UI cleanup.
- Preserve the current user workflow before improving layout.
- Separate request-level concerns from dossier-level concerns.
- Put server state in TanStack Query; keep local state for open panels, selected tabs, selected files, and temporary form drafts.
- Use Sonner for action feedback: save success, submit success, upload success, download errors, creation/update failures.
- Keep persistent in-page notices only for workflow state: action required, no action required, dossier phase status, required next step.
- Use shadcn components for form fields, buttons, cards, tabs, select controls, alerts, and separators where available.

## Proposed Structure

Create a request-detail folder:

```txt
apps/portal/src/pages/request-detail/
  constants.ts
  dossier.constants.ts
  formatters.ts
  helpers.ts
  types.ts
  RequestDetailHeader.tsx
  RequestWorkflowTabs.tsx
  RequestSummaryTab.tsx
  RequestCourrierTab.tsx
  RequestActionsTab.tsx
  RequestDossierTab.tsx
  RequestHistoryTab.tsx
  ProcessTimeline.tsx
  MeetingBlock.tsx
  Phase2DocumentChecklist.tsx
  DossierOverviewPanel.tsx
  PreliminaryPhasePanel.tsx
  FormalRequestPhasePanel.tsx
  PreEvaluationUploadForm.tsx
  FormalRequestCourrierForm.tsx
```

Keep `RequestDetailPage.tsx` as the orchestrator only:

- read route params
- call query hooks
- hold selected tab/sub-tab UI state
- pass data and handlers to child components
- render loading/not found/page shell

Longer-term shape: `RequestDetailPage.tsx` should remain the entry point, while each OMA phase becomes distinguishable and independently maintainable. Phase I, Phase II, and Phase III should eventually live in separate components, with their own local display helpers and form components, so updates to one certification phase do not force engineers to re-read or risk the entire request detail workflow.

## Progress

Completed:

- Extracted pure helpers, constants, formatters, and local types into `request-detail/`.
- Extracted display components:
  - `ProcessTimeline`
  - `MeetingBlock`
  - `RequestDetailHeader`
  - `RequestWorkflowTabs`
  - `RequestHistoryTab`
- Extracted main workflow tabs:
  - `RequestSummaryTab`
  - `RequestCourrierTab`
  - `RequestActionsTab`
  - `RequestDossierTab`
- Split dossier workflow internals:
  - `DossierOverviewPanel`
  - `PreliminaryPhasePanel`
  - `FormalRequestPhasePanel`
  - `Phase2DocumentChecklist`
- Completed the first notice cleanup pass:
  - action success feedback uses Sonner
  - action/server failures for request update and submission use Sonner
  - download failures use Sonner while still feeding existing local download error slots
  - blocking form validation remains inline near the affected workflow
  - unreadable encoded messages were cleaned from `RequestDetailPage.tsx`
- Started form hardening:
  - `RequestSummaryTab` draft metadata form now uses React Hook Form
  - request type now uses shadcn `Select`
  - subject uses shadcn `Input`
  - form container and read-only submitted view use shadcn `Card`
  - buttons use shadcn `Button`
  - required/optional badges and the message character counter match the draft creation modal
  - introduced reusable `DocumentFileField` for upload controls
  - `RequestCourrierTab` now uses React Hook Form, shadcn `Card`, `Select`, `Input`, `Button`, and `DocumentFileField`
  - courrier submission validates portal upload vs physical deposit fields before calling the parent submit handler
- Kept `RequestDetailPage.tsx` as the current orchestrator for state, route params, loading, handlers, and API calls.
- Reduced `RequestDetailPage.tsx` from about 1850 lines to about 539 lines.
- Verified each slice with `npm run typecheck` and `npm run build`.

Current state:

- The structural split is largely complete.
- The page still uses local server-state loading and mutation handlers.
- Forms still mostly use plain controls and should be hardened one workflow at a time.
- Form-local feedback still uses inline state where it helps the user fix the active upload or validation step.

## Query and API Plan

Add or extend query hooks under `apps/portal/src/lib/query`:

- `usePortalRequest(requestId)`
- `useUpdatePortalRequest()`
- `useSubmitPortalRequestWithCourrier()`
- `usePortalDossier(dossierId, { enabled })`
- `useUploadPreEvaluationForm()`
- `useUploadFormalRequestCourrier()`
- `useUploadFormalRequestDocument()`
- download helpers can stay direct functions for now because they return blobs and are user-triggered.

Invalidate narrowly:

- request update: invalidate `requests.detail(requestId)` and request lists
- request submit: invalidate `requests.detail(requestId)`, request lists, and dossier detail if opened
- dossier upload: invalidate `dossiers.detail(dossierId)`
- formal request upload: invalidate `dossiers.detail(dossierId)`

## Step-by-Step Refactor

### Step 1 - Extract Pure Helpers

Status: Completed.

Moved these out first because they are low risk:

- `formatDate`
- `formatDateTime`
- `getErrorMessage`
- `dossierTypeLabels`
- `portalStatusGuidance`
- `REQ_STATUS_LABELS`
- `REQ_STATUS_CLASSES`
- `requestTypeOptions`
- `locationOptions`
- process step builder

Target files:

- `request-detail/formatters.ts`
- `request-detail/constants.ts`
- `request-detail/helpers.ts`
- `request-detail/types.ts`

Risk: low. The main risk is import churn or accidentally changing labels.

### Step 2 - Extract Display-Only Components

Status: Completed.

Moved components that do not own network calls:

- `ProcessTimeline`
- `MeetingBlock`
- `RequestDetailHeader`
- `RequestWorkflowTabs`
- `RequestHistoryTab`

Use shadcn `Card`, `Tabs`, `Badge`, and `Button` where natural.

Risk: low to medium. This is mostly JSX movement, but class names and props can regress layout.

### Step 3 - Convert Main Tabs to Components

Status: Completed for the main tabs. Further internal splitting remains useful for forms.

Split each tab into a focused file:

- `RequestSummaryTab`
- `RequestCourrierTab`
- `RequestActionsTab`
- `RequestDossierTab`

Each component should receive explicit props instead of reading page state indirectly.

Risk: medium. This is where state ownership can get confused. Keep handlers in the page at first, then move them after behavior is stable.

### Step 4 - Replace Inline Notices With Clear UI Rules

Status: Completed for the first pass.

Classify every message:

- Action feedback: Sonner only.
- Workflow guidance: persistent shadcn `Alert` or card notice.
- Blocking error: inline `Alert` near the affected workflow, plus Sonner if triggered by a user action.
- Empty state: page/card empty state, not a red error.

Urgent examples:

- Save request success should be Sonner.
- Submit courrier success should be Sonner.
- Upload success should be Sonner.
- Download failure should be Sonner.
- `No action required` should remain inline, but styled as calm workflow guidance.
- `Action required` should remain inline, but styled as a clear next-step card.

Risk: medium. Removing the wrong inline message could hide important workflow state. Each message must be classified before removal.

Result: action feedback now uses Sonner for request updates/submission, upload successes, and download failures. Persistent workflow guidance remains inline. Blocking validation and upload-form errors remain close to the affected workflow so users can fix the issue without hunting for context.

### Step 5 - Harden Forms With shadcn and React Hook Form

Status: In progress.

Refactor one form at a time:

1. Request draft metadata form
   - request type
   - subject
   - message

   Status: Completed.

2. Courrier submission form
   - upload mode
   - file upload
   - physical deposit fields

   Status: Completed.

3. Pre-evaluation upload form
   - file input
   - constraints notice

   Status: Next recommended form slice.

4. Formal request courrier form
   - location select
   - file input
   - notes if applicable

5. Formal requirement upload form
   - file input
   - notes textarea
   - template download

Use:

- shadcn `Field`
- shadcn `Input`
- shadcn `Select`
- shadcn `Button`
- shadcn `Card`
- Sonner for submit result
- character counters for long text areas where useful
- required/optional badges as already introduced on request creation

Risk: medium to high. File inputs and multipart submissions are easy to break. Keep one form per commit or checkpoint.

### Step 6 - Introduce Query Hooks

Status: Not started.

After the UI is split, move network state into TanStack Query:

- request detail loading
- dossier detail loading
- mutations for update/submit/upload

The page should stop manually coordinating refreshes with broad local `loadRequest` and `loadDossier` calls.

Risk: high. This changes data flow. Do it only after the component split makes each workflow easy to test.

### Step 7 - Improve Dossier Phase Navigation

Status: Not started.

Replace custom sub-tab classes with shadcn `Tabs`.

Recommended shape:

- Main page tabs: Resume, Courrier, Actions, Dossier, Historique.
- Dossier tabs: Apercu, Phase I, Phase II, Phase III.
- Hide dossier tabs that are not available yet, but show an explanatory empty state when the whole dossier section is not opened.

Risk: medium. Users may rely on current tab behavior, so preserve default tab selection logic.

### Step 8 - Cleanup and Remove Dead Page Paths

Status: Not started.

Once the modal creation flow is stable, review whether `NewRequestPage` still has a role.

Options:

- Keep it as a deep-link fallback for now.
- Redirect it to `portalRoutes.requests` and open the modal later if we support route-driven modals.
- Remove it only after confirming no route or navigation still depends on it.

Risk: medium. Route removal can break bookmarks or future workflows.

## Urgent Improvements

- Split pure helpers/constants from `RequestDetailPage.tsx`.
- Extract display-only components.
- Classify notices: Sonner feedback vs persistent workflow guidance.
- Replace custom buttons in the most-used actions with shadcn `Button`.
- Keep request creation modal aligned with the detail page after creation.

## Can Be Delayed

- Full TanStack Query migration for every mutation.
- Route-level lazy loading.
- Deep-linkable modal state for new request creation.
- Full dossier phase redesign.
- Removing `NewRequestPage`.
- Zustand or any client store. There is no clear need yet.

## UI Improvement Hints

- Use a stronger page header with request type, subject, status badge, and primary next action.
- Put the current next step in a dedicated card near the top.
- Make tabs visually distinct with shadcn `Tabs`; avoid every section feeling like the same flat block.
- Use `CardHeader`, `CardTitle`, and `CardDescription` to separate status, forms, and document lists.
- Use quiet neutral cards for read-only information and stronger accent alerts only for required action.
- Keep upload forms compact and close to the document they affect.
- Use dropdown actions for secondary document actions if a row has multiple possible actions.
- Prefer skeleton/loading blocks per section instead of one page-wide generic loading state after initial page load.

## Workflow Improvement Hints

- After request creation, the detail page should clearly tell the postulant the next step: complete or submit the initial courrier.
- If a request is still a draft, prioritize edit and submit actions.
- If a request is submitted and no action is required, the page should emphasize consultation/status rather than forms.
- If dossier actions are required, surface them in the `Actions` tab and link to the exact dossier phase section.
- Downloads should not create persistent inline errors far from the clicked button; use Sonner and keep local button state if needed.

## Verification Plan

After each slice:

```txt
npm run typecheck
npm run build
```

Manual checks:

- Open an existing draft request.
- Edit request metadata.
- Submit initial courrier.
- Open a submitted request with no dossier.
- Open a request with a dossier.
- Download a dossier document/template.
- Upload pre-evaluation form.
- Upload a formal request document.
- Confirm Sonner appears for action success/error and persistent workflow notices remain visible.

Known local caveat:

On this Windows sandbox, `npm run build` can fail with the Tailwind/Vite native `spawn EPERM` issue. Rerun outside the sandbox when that happens.

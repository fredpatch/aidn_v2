# TASK

## Current Phase

Phase O8.4 - meeting and payment demo interactions: completed.

## Completed Output

- Phase O1 created `docs/aidn-oma-revised-workflow-blueprint-v1.md`.
- Phase O2 added explicit internal DN/Admin status and simplified postulant-facing status layers.
- Phase O3 reworked `/dossiers/:id` into a read-only Dossier DN workspace.
- Phase O4 added mock-only OMA phase evidence and next-action structures.
- Phase O5 aligned certificates with the manual DN lifecycle.
- Phase O6 aligned `/reports` with official DN reporting indicators.
- Phase O6b clarified `/reports` KPI grouping and units.
- Phase O6c improved report visual hierarchy:
  - renamed `Volumes d'activite` to `Synthese d'activite`
  - kept `Delais cles` as a separate KPI group
  - added the helper note separating volumes and delays
  - added focused responsive bar charts with `recharts`
  - split visual analysis into demandes by entry channel, average delay by phase, demandes by status, and certificates by lifecycle
  - kept completeness alerts as cards/list rather than charts
- Phase O7 added a read-only `/portal-preview` demo page:
  - added a Prototype navigation group with `Portail postulant demo`
  - shows a simplified organism-facing preview for demandes, actions, documents, meetings, payments, notifications, and certificate withdrawal
  - reuses existing mock hooks and portal status labels
  - keeps internal administrative vocabulary out of the applicant-facing page
- Phase O8.1 added demo-only browser state:
  - created a localStorage-backed AIDN demo state seeded from existing mock arrays
  - added get/set/reset/update helpers with browser and parse-failure guards
  - updated fake API reads to use demo state for mutable mock collections
  - kept static decision/timeline reference streams unchanged for now
- Phase O8.2 added controlled demo interactions:
  - added demo action helpers for evidence status updates, next-action completion, and reset
  - added a visible dossier detail demo note and reset control
  - added evidence checklist actions for Recu, Valide, and Manquant demo statuses
  - added a demo-only next-action completion control
  - invalidates AIDN React Query reads after local demo updates
- Phase O8.3 added controlled certificate lifecycle demo interactions:
  - added helpers to derive and advance the manual certificate lifecycle
  - updates lifecycle timestamps in local demo state without generating files
  - added certificate demo actions in `/certificats`
  - added the same certificate demo action in `/dossiers/:id`
  - keeps portal preview read-only while reflecting refreshed certificate state
- Phase O8.4 added controlled meeting and payment demo interactions:
  - added meeting helpers for local demo scheduling and report availability
  - added payment evidence helpers for local received/validated statuses
  - added meeting demo actions in `/reunions`
  - added meeting and payment shortcuts in `/dossiers/:id`
  - kept `/portal-preview` read-only while reflecting refreshed local state

## Guardrails

Strictly out of scope unless a later phase explicitly asks for it:

- No backend implementation.
- No database/schema model.
- No UI mutations.
- No real upload.
- No real email sending.
- No real export.
- No real certificate generation.
- No real persistence; localStorage is allowed only for browser demo state.
- No additional dependencies beyond explicitly approved frontend charting packages.
- No real postulant portal implementation yet; `/portal-preview` is demo-only and read-only.

## Source Context

AIDN must remain a semi-digital traceability system for now.

- The app supports both digital portal submissions and physical ANAC deposits.
- DG instruction remains a physical administrative circuit.
- DN scans/uploads returned DG courrier and workflow evidence into the postulant/dossier file.
- A Dossier DN must not be treated as automatically existing after a demande.
- OMA workflow phases should show formal evidence, especially phase closure courrier.
- Certificates are manually prepared, printed, signed/cacheted, scanned into AIDN, then tracked for withdrawal/remise and archive.
- Reports are mock-derived UI indicators only until backend aggregation/export is validated.

Primary planning sources:

- `Cahier_des_charges.docx`
- `Etude de faisabilite - AIDN.doc` / `Étude de faisabilité - AIDN.doc`
- `AIDN_OMA_WORKFLOW_SOURCE_NOTES.md`
- `AIDN-WORKFLOW-OMA.md`
- `docs/aidn-oma-revised-workflow-blueprint-v1.md`

## Next Action

Phase P - Prototype stakeholder review and correction backlog.

P should remain validation-focused:

- Review the revised admin flow, demo interactions, and portal preview with stakeholders.
- Collect wording, workflow, evidence, KPI, and data-model corrections.
- Keep admin mock flow as the source of truth until a real portal/backend phase is approved.
- Do not add authentication, backend code, database schema, real upload, email, export, real persistence, payment processing, or certificate generation behavior unless explicitly scoped.

## Verification

- Passed: `npx tsc --noEmit`
- Passed: `npm run build`
- Note: Vite still reports the known large chunk warning after build.

## Phase O6c Expected Result

Status Item

- Done: `/reports` route unchanged.
- Done: `Synthese d'activite` count KPI group added.
- Done: `Delais cles` duration/alert KPI group retained.
- Done: Visual analysis section added.
- Done: Demandes by entry channel chart added.
- Done: Average delay by phase chart added.
- Done: Demandes by status chart added.
- Done: Certificates by lifecycle chart added.
- Done: Completeness alerts kept as non-chart alert cards.
- Done: `recharts` installed for stronger KPI/chart rendering.
- Done: No backend/schema/mutation/export behavior introduced.

## Phase O7 Expected Result

Status Item

- Done: `/portal-preview` route added.
- Done: `PortalPreviewPage` added.
- Done: Prototype navigation item added.
- Done: Page header and prototype note added.
- Done: Existing mock hooks reused.
- Done: Representative organism selector added.
- Done: Applicant-facing sections added for demandes, actions, documents, meetings, payments, notifications, and certificate withdrawal.
- Done: Internal administrative vocabulary avoided in the preview page UI.
- Done: Page remains read-only with no backend/schema/mutation/upload/email/export/certificate download behavior.

## Phase O8.1 Expected Result

Status Item

- Done: `client/src/features/aidn/storage/aidn-demo-storage.ts` added.
- Done: `AIDN_DEMO_STORAGE_KEY` defined as `aidn.demo.state.v1`.
- Done: `AidnDemoState` includes demandes, courriers, dossiers, phases, documents, meetings, certificates, evidence, next actions, and `updatedAt`.
- Done: Demo state seeded from existing mock arrays.
- Done: `getAidnDemoState`, `setAidnDemoState`, `resetAidnDemoState`, and `updateAidnDemoState` added.
- Done: localStorage access is guarded and falls back to mock seed on unavailable storage or parse failure.
- Done: Fake API reads use demo state for mutable mock collections.
- Done: No UI mutations, buttons, backend/schema/real persistence/upload/email/export/certificate generation introduced.

## Phase O8.2 Expected Result

Status Item

- Done: `client/src/features/aidn/storage/aidn-demo-actions.ts` added.
- Done: Demo helper updates phase evidence status in localStorage-backed state.
- Done: Demo helper marks phase next action as done in localStorage-backed state.
- Done: Demo helper resets local demo data.
- Done: `/dossiers/:id` shows a demo note near the top.
- Done: `/dossiers/:id` has a visible `Reinitialiser la demo` control.
- Done: Evidence checklist rows include Recu, Valide, and Manquant demo actions.
- Done: Non-applicable evidence actions are disabled.
- Done: Next action blocks include `Marquer fait dans la demo`.
- Done: AIDN React Query reads are invalidated after updates/reset.
- Done: No backend/schema/real persistence/upload/email/export/certificate generation introduced.

## Phase O8.3 Expected Result

Status Item

- Done: `advanceCertificateLifecycle` added.
- Done: `setCertificateLifecycleStatus` added for future targeted demo updates.
- Done: `getNextCertificateLifecycleStatus` added.
- Done: `getNextCertificateLifecycleActionLabel` added.
- Done: Advancing certificate lifecycle updates the relevant timestamp fields in local demo state.
- Done: `/certificats` includes a demo lifecycle action in row actions and detail view.
- Done: `/certificats` includes a demo note explaining local simulation only.
- Done: `/dossiers/:id` certificate section includes the same demo lifecycle action.
- Done: Portal preview remains read-only and reflects certificate state through existing query refresh.
- Done: No backend/schema/real persistence/upload/email/export/certificate generation introduced.

## Phase O8.4 Expected Result

Status Item

- Done: `markMeetingScheduled` added.
- Done: `markMeetingReportAvailable` added.
- Done: `markPaymentEvidenceReceived` added.
- Done: `markPaymentEvidenceValidated` added.
- Done: `/reunions` includes a demo note explaining local simulation only.
- Done: `/reunions` includes meeting scheduling and report availability demo actions.
- Done: `/dossiers/:id` meetings section includes matching meeting demo actions.
- Done: `/dossiers/:id` payment evidence rows include received/validated shortcuts.
- Done: Portal preview remains read-only and reflects updated meeting/payment states through existing query refresh.
- Done: No backend/schema/real persistence/upload/email/export/payment/certificate generation introduced.

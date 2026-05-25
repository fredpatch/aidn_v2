# Quick Reference

Last updated: 2026-05-22

## OMA-1H Hardening Audit Notes (2026-05-22)

- `uploadClosureCourrier` service function exists but no admin route is wired and no UI in DossierDetailPage.tsx.
- `pre_eval_dg_returned` is a dead status - never set by backend; remove from labels, model, and UI.
- `SendToDgPanel` wording in DossierDetailPage.tsx ("Envoyer au DG") contradicts physical circuit language - fix to "Marquer mis en circuit officiel".
- `returnsToRegister` count == `awaitingReturn` count in dg-circuit.service.ts - needs fix.
- Portal `isSubmitted` banner persists after dossier is open - suppress when `request.dossierId` is set.
- "Circuit DG" → "Circuit officiel" rename pending (nav + page title).
- French accent sweep needed in both portal and admin UI strings.
- Reusable patterns: `InviteMeetingForm`, `RecordMeetingForm`, `saveDocument`, `STATUS → portal label` map, per-status sub-components.
- H1 slice is next; see current-task.md and summary for full roadmap.

## ADMIN-ADJ-1 Notes (2026-05-25)

- `dn_agent` and `dn_supervisor` no longer have `DG_CIRCUIT_HANDLE` - they cannot access `/circuit-dg` (Courriers officiels) and cannot see Imprimer/Retour DG buttons in Demandes page.
- `dn_supervisor` also lost `COURRIER_REGISTER_PHYSICAL` - the any-of guard on `/circuit-dg` required both to be removed.
- `Demandes` page refactored to split-view: `lg:grid lg:grid-cols-[2fr_3fr]` left-list + right-detail, auto-selects first item on load.
- `Ouvrir dossier` → `Démarrer la phase préliminaire` (UI label only, backend enum unchanged).
- `Prêt pour phase préliminaire` emerald badge shown in detail panel when `canOpenDossier` is true.
- Permission constants changed: `dn_supervisor` lost `DG_CIRCUIT_HANDLE`, `COURRIER_REGISTER_PHYSICAL`; `dn_agent` lost `DG_CIRCUIT_HANDLE`.

## Current Objective Notes

- PORTAL-H1D-1 implemented:
  - Rendez-vous meeting cards and selected-day calendar items expose `Voir la convocation` and `Imprimer`.
  - Convocation card is frontend-only, uses existing `PortalMeeting` data and current portal user name, and prints via browser print.
  - Print CSS hides app chrome/buttons and prints only `.print-area` in a clean black/white layout.
  - No backend, PDF generation, document registry, acknowledgement, email, QR code, or new dependency was added.
- PORTAL-H1D implemented:
  - Added read-only `GET /api/v1/portal/meetings`, scoped by `Meeting.dossierId -> Dossier.postulantUserId === portal actor id`.
  - Default meeting window is 30 days past through 180 days future; unscheduled meetings are included last only for default-window queries.
  - Added portal `/rendez-vous`, `PortalCalendar`, sidebar link, and dashboard next rendez-vous card.
  - No meeting mutation, Outlook, notification, shadcn, or date-fns dependency was added.
- ROLE-UX-1A implemented:
  - Circuit DG physical action wording must not imply digital sending.
  - Pre-evaluation DG return upload route expects multipart field `file`.
  - Initial request DG return upload route expects multipart field `returnedScannedDocument`.
  - Circuit DG now sends only the field expected by the target endpoint.
- ROLE-UX-1 implemented:
  - Do not grant `DOSSIER_VIEW_ALL` to DG circuit actors.
  - Added a focused `Circuit DG` workspace backed by `GET /api/v1/admin/dg-circuit/tasks`, guarded by DG circuit capabilities.
  - `/dossiers` and `/dossiers/:id` should remain DN/admin full-workflow surfaces guarded by `DOSSIER_VIEW_ALL`.
  - Task sources: initial request DG circuit and preliminary pre-evaluation DG circuit.
- OMA-1F corrected pre-evaluation responsibility:
  - `PRE_EVAL_DG_CIRCUIT_HANDLE` handles completed form physical DG transmission and annotated-return registration.
  - `PRE_EVAL_DG_RETURN_CONSULT` allows consulting/downloading the registered annotated DG return.
- Default DN roles do not receive `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- Reception, bureau courrier, and DG secretariat receive `PRE_EVAL_DG_CIRCUIT_HANDLE`.
- DN continuation is gated by `pre_eval_dg_decision_recorded` plus linked `preEvaluationDgAnnotatedDocumentId`.

## Verification

- API build: `npm run build` in `apps/api`.
- Admin typecheck: `npx tsc --noEmit` in `apps/admin`.
- Admin build: `npm run build` in `apps/admin`; may need outside-sandbox rerun for Tailwind native Windows binary.

# OMA-OPS-8B - Status labels + French UI cleanup

Date: 2026-05-25
Status: **Complete - admin typecheck PASS, admin build PASS, portal typecheck PASS, portal build PASS**

---

## Objective

Eliminate raw enum leakage and no-accent French from active admin and portal UI.
Centralize meeting status labels in admin. Harden portal fallbacks.

---

## Files Inspected

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-preliminary-hardening-audit.md`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`
- `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`
- `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx` (already clean - no changes needed)
- `apps/admin/src/lib/api/dossiers.api.ts` (PreliminaryStatus confirmed clean, no pre_eval_dg_returned)
- `apps/portal/src/components/RequestStatusBadge.tsx`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/pages/RendezVousPage.tsx` (already clean)
- `apps/portal/src/pages/MyRequestsPage.tsx` (no issues)

## Files Changed

| File                         | Change                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dossier-detail.helpers.tsx` | Updated 6 preliminary status labels; added `meetingStatusLabels` export; fixed `MeetingCard` raw status render; fixed `PhaseStatusBadge` fallback                        |
| `DossierCourriersTab.tsx`    | Fixed sourceLabels, decisionLabels, section title, row labels, download button text, error message, description                                                          |
| `DossierHistoriqueTab.tsx`   | Fixed categoryLabels, filterLabels, phaseLabels, dossierStatusPhaseLabels, formatDateTime fallback, all event titles/descriptions, KPI labels, UI strings, error message |
| `RequestStatusBadge.tsx`     | Fixed fallback from raw enum to `"Statut en cours de mise à jour"`                                                                                                       |
| `RequestDetailPage.tsx`      | Added `planned`/`postponed` to MeetingBlock; fixed raw status fallback                                                                                                   |

---

## Key Decisions

### Admin label changes

| Key                             | Old                       | New                                    |
| ------------------------------- | ------------------------- | -------------------------------------- |
| `preliminary_started`           | "Démarrée"                | "Phase préliminaire démarrée"          |
| `pre_eval_form_available`       | "Formulaire disponible"   | "Formulaire pré-évaluation disponible" |
| `pre_eval_form_submitted`       | "Formulaire soumis"       | "Formulaire pré-évaluation soumis"     |
| `pre_eval_sent_to_dg`           | "Mise en circuit DG"      | "Pré-évaluation mise en circuit DG"    |
| `pre_eval_dg_decision_recorded` | "Décision DG enregistrée" | "Retour DG pré-évaluation enregistré"  |
| `preliminary_ready_to_close`    | "Prête à clore"           | "Prêt à clôturer"                      |
| `preliminary_closed`            | "Clôturée"                | "Phase préliminaire clôturée"          |

### `meetingStatusLabels` added to `dossier-detail.helpers.tsx`

Exported for re-use. `MeetingCard` now uses it; `DossierMeetingsTab` has its own local copy (left as-is since it already had correct labels).

### `pre_eval_dg_returned`

Confirmed absent from `PreliminaryStatus` type - already cleaned in OMA-OPS-8A. No changes needed.

### Portal fallback

`RequestStatusBadge.getRequestStatusLabel`: `?? status` → `?? "Statut en cours de mise à jour"`.
Portal `MeetingBlock`: added `planned`/`postponed`; fallback → "Statut non reconnu".

---

## Verification

- Admin typecheck: **PASS** (no output)
- Admin build: **PASS** (1,546 kB / 444 kB gzip)
- Portal typecheck: **PASS** (no output)
- Portal build: **PASS** (343 kB / 102 kB gzip)
- API build: not run (no API files changed)
- Manual checks: pending runtime browser validation

---

## Risks / TODOs

- `DossierMeetingsTab.tsx` has its own local `statusLabels` (already correct French). Could be unified with the new exported `meetingStatusLabels` in a later cleanup pass.
- `DossierHistoriqueTab.tsx` still has `"Ouverture du dossier DN."` description - acceptable, kept unchanged.

---

## Next Step

OMA-OPS-8C: Evidence/SLA readiness - document metadata serialization, meeting `heldAt`, report-required decision, portal visibility decisions.

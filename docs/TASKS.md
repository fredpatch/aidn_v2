# AIDN v2 — TASKS.md (Sprint Tracker)

Generated: 2026-07-01, from `TASK.md`, `exploration-cache/tasks/*`, `exploration-cache/06-workflows/*`.
Purpose: single source of truth for sprint progression. Update only the touched sprint after each work session — same rule as `exploration-cache/README.md`.

## Stack snapshot
- `apps/admin` — Vite/React/TS, internal staff UI (DN, DG secretariat, reception, bureau courrier, admin).
- `apps/portal` — Vite/React/TS, external applicant (postulant) UI. Was split out of admin's `/portal-preview`; now standalone with its own Axios + TanStack Query layer.
- `apps/api` — Express + TypeScript modular monolith, MongoDB/Mongoose. Modules: account-requests, admin, audit, auth, courriers, dashboard, dg-circuit, dg-reviews, document-evaluations, document-templates, documents, dossiers, meetings, notifications, oma-phases, organizations, payments, personnel, portal, reports, requests, users.
- Personnel identity: MariaDB `employee_directory` view (real org directory), separate from AIDN's own Mongo accounts.
- No test framework wired in any app (`npm run lint`/`typecheck` = `tsc --noEmit` only, no jest/vitest). No CI config found. **This is a gap, not an oversight to preserve.**

## OMA business process (5 official phases)
1. `preliminary` — Phase préliminaire
2. `formal_application` — Demande formelle
3. `document_evaluation` — Évaluation approfondie des documents
4. `onsite_demonstration` — Démonstration sur site
5. `delivery` — Délivrance / certificat

---

## Sprint 0 — Prototype foundation (admin-only, mock data)
**Status: Done**
- Admin app scaffolded (dashboard, demandes, courriers/orientation DG, dossiers DN, workflow OMA, documents, reunions, certificats, reports, settings).
- All data mock-first via `VITE_DATA_MODE=mock`, browser-only demo auth token.
- Read-only `/portal-preview` added inside admin shell (later replaced by Sprint 5).
- LocalStorage-backed demo state (`aidn.demo.state.v1`) for mutable mock collections.

## Sprint 1 — Backend foundation & auth
**Status: Done**
- `apps/api` created (Express modular monolith, Mongoose models for all core entities).
- Role/permission constants + capability middleware.
- Internal login, current-user endpoint, bootstrap admin seed.
- Official personnel adapter: mock impl → `MariaPersonnelAdapter` over `employee_directory` (real DB), selected via `OFFICIAL_PERSONNEL_DB_ENABLED`.
- AIDN-owned internal accounts: activation, temp password, forced first-login change.
- Audit logging on login/activation/role changes; `AUDIT_VIEW`-guarded audit listing.

## Sprint 2 — Intake & DG circuit workflow (real backend)
**Status: Done**
- Portal courrier submission: single `Courrier initial` section, mode selector (upload vs physical deposit), one submit action.
- Admin request list defaults to submitted/processable demandes.
- Print action (`Imprimer`) starts DG circuit directly (`initial_sent_to_dg`); `Transmettre au DG` removed from normal path.
- DG return recording: decision + return date + mandatory annotated scan (HTTP 400 if missing), registered in Documents (`dg_annotated_courrier`).
- DN verification (`Démarrer`) hard-blocked until DG return + scan are both present — enforced backend-side, not just UI-side.
- Admin KPIs split by channel: portal uploads, planned/received physical deposits, en attente DG, à traiter retour DG, orientées DN, annulées DG.
- Role/permission tightening (`ADMIN-ADJ-1`): `dn_agent`/`dn_supervisor` lost `DG_CIRCUIT_HANDLE`; split-view Demandes page.

## Sprint 3 — OMA Phase 1: Préliminaire
**Status: Done**
- Dossier DN workspace (`/dossiers/:id`) reworked to read-only-plus-guided-actions.
- Phase evidence + next-action model per phase.
- `pre_eval_dg_returned` identified as dead status — flagged for removal, not yet cleaned (see Backlog).

## Sprint 4 — OMA Phase 2: Demande formelle
**Status: Done** (`OMA-FORMAL-*`)
- Portal document-template download endpoint, phase-guarded.
- `formalRequest.requirements[]` / `.progress` / `.formalMeeting` on portal dossier payload.
- `Phase2DocumentChecklist` component: per-row status, template download, upload.
- Hardening pass (`OMA-HARDENING-2`): expanded submission statuses (`submitted/under_review/validated/requires_correction/incomplete/rejected`), re-upload allowed on `missing/requires_correction/incomplete/rejected`.

## Sprint 5 — OMA Phase 3: Évaluation approfondie des documents
**Status: Done** (`OMA-EVAL-1` → `OMA-EVAL-6d`, `S5` sub-thread)
- Payment gate before DN can start document study (`PhasePayment` model).
- Document evaluation + correction loop + phase close (`document_evaluation_ready_to_close` → `document_evaluation_closed`).
- Admin Phase 3 workspace UI; portal Phase 3 read/download + action block.
- Internal payment workspace (Facturation S5): task list endpoint, frontend route/nav, workspace UI.

## Sprint 6 — Dashboard
**Status: Done** (`DASH-1`, `DASH-2`, `DASH-2R`)
- `GET /api/v1/admin/dashboard`, guarded by `REPORT_VIEW`, presets (today/7d/month/year/custom).
- Profile-aware sections (`dn_full` vs `courrier_dg`).
- Official SLA constants corrected: 30/10/30/25/5 business days per phase.
- Certificate metrics explicitly `À venir` / `Non disponible` until certificate backend exists — do not fake this data.

## Sprint 7 — Personnel API integration
**Status: Done** (2026-06-16 → 2026-06-17)
- Real personnel search/list endpoints wired end-to-end (axios correction, envelope correction, real payload mapping, URL logging fix, empty-search fix, blank-search UI correction).
- List-endpoint integration completed 2026-06-17.

## Sprint 8 — Portal API & TanStack Query refactor
**Status: In progress — this is the active sprint**
- Plan: `exploration-cache/tasks/plan/2026-06-17-portal-api-query-refactor-plan.md`
- Done: `portal.api.ts` split into domain modules (auth, account-requests, requests, dossiers, formal-request, meetings, notifications, document-evaluation); fetch → Axios; HTTP infra grouped under `lib/api/http/`; TanStack Query wired (`QueryClientProvider`, query keys/queries under `lib/query/`); `usePortalRequests`/`usePortalMeetings`/`usePortalNotifications` added; `MyRequestsPage` and `PortalDashboardPage` migrated off manual `useEffect`/`Promise.all`.
- **Next 3 actions (per `current-task.md`):**
  1. [ ] Convert `NotificationsPage` to `usePortalNotifications`.
  2. [ ] Add notification mutations: mark-one-read, mark-all-read.
  3. [ ] Invalidate notification query keys after successful mutation.
- Known issue to carry: portal build has a >500kB chunk-size warning — route-level lazy loading deferred, not fixed.

---

## Backlog (not started — ordered by likely priority)

### Sprint 9 — OMA Phase 4: Démonstration sur site
**Status: Not started.** No backend module, no UI. Needed before Phase 5 can be meaningfully real (delivery depends on a completed demonstration record).

### Sprint 10 — OMA Phase 5: Délivrance / certificat (real backend)
**Status: Not started — currently demo-only.** Certificate lifecycle is manual/localStorage-simulated (`advanceCertificateLifecycle` etc., Sprint 0 legacy). Dashboard already reserves `unavailableMetrics: ["certificates"]` for this. Needs real model + file generation, not just status flips.

### Sprint 11 — Cleanup debt flagged by hardening audits
- [ ] Remove dead status `pre_eval_dg_returned` (model + labels + UI).
- [ ] Fix `SendToDgPanel` wording ("Envoyer au DG") — contradicts physical-circuit language; should read "Marquer mis en circuit officiel".
- [ ] Fix `returnsToRegister` count bug in `dg-circuit.service.ts` (currently equals `awaitingReturn`, should be distinct).
- [ ] Suppress portal `isSubmitted` banner once `request.dossierId` is set.
- [ ] Rename "Circuit DG" → "Circuit officiel" (nav + page title) — pending, not yet applied.
- [ ] French accent sweep across portal + admin UI strings.
- [ ] Refresh `exploration-cache/00-control/CURRENT_STATE.md`, `09-qa/KNOWN_GAPS.md`, `09-qa/RISK_REGISTER.md` — all still dated 2026-05-05, materially stale (predate Sprints 5–8).
- [ ] Fill stub cache pages: `06-workflows/OMA_PHASES.md`, `09-qa/KNOWN_ISSUES.md` (both are `TODO` placeholders).

### Sprint 12 — Test infrastructure
**Status: Not started.** Zero automated tests across all three apps. `lint`/`typecheck` scripts are just `tsc --noEmit`. Before this gets riskier to touch (5 apps × mock/API dual-mode), get at minimum:
- [ ] API: integration tests for auth, DG-return-scan gate, payment gate, phase-close guards (these are the ones with hard business-rule enforcement — highest regression risk).
- [ ] Admin/Portal: component tests for the phase checklists and status-mapping utils (pure logic, cheap to test, high blast radius when wrong).

### Sprint 13 — External integrations
**Status: Not started.** Email/Outlook/storage/notifications are labels or in-app only, no real integration (per `08-integrations`, still accurate as of last check).

### Sprint 14 — Portal auth boundary
**Status: Not started.** Per Risk Register: portal currently shares admin's auth context/token scheme. High-impact risk before any real external rollout — postulants and internal staff should not sit on the same auth realm.

### Sprint 15 — Production deployment hardening
`infra/` has Dockerfile + compose (dev/test/prod) + nginx-spa.conf already. Not yet audited in this pass — needs its own review pass covering secrets management (`infra/secrets/`), prod env files, and MySQL container sizing (22MB `infra/mysql` seed data currently sitting in the repo).

---

## How to use this file
- One sprint = one unit of "what came before, what's now, what's next." Don't split a sprint mid-task.
- When Sprint 8 finishes, promote Sprint 9 header to "Status: In progress", move Sprint 8 to the Done block above the divider.
- Cross-check against `exploration-cache/tasks/current-task.md` before starting work — that file is the more granular day-to-day pointer; this file is the sprint-level view.

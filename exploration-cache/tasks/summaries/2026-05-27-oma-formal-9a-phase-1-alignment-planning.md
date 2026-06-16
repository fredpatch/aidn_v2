# OMA-FORMAL-9A Adjustment - Align Phase 2 with Phase 1 Workflow UI

Date: 2026-05-27
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan the adjustment of the existing Phase 2 admin workspace so it follows the same visual and workflow structure as the Phase préliminaire screen.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`

## Source files inspected

- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9a-phase-1-alignment-planning.md`

## Key decisions

- Keep the current `getAdminFormalRequestPhase(dossierId)` API-backed read model.
- Do not add backend endpoints, portal UI, mutation dialogs, fake data, or downloads.
- Rework Phase 2 into the same broad structure as Phase 1:
  - left phases list remains unchanged
  - left active progression card becomes Phase-aware
  - right workspace becomes a chronological workflow panel
  - final status card explains the next action
- Supporting documents remain tracking-only and must not visually block DG progression.

## Implementation details planned

### Left progression card

Add Phase 2 progression computation from the formal request read model only.

Required steps:

1. Courrier de demande formelle reçu
2. Demande formelle transmise au circuit DG
3. Retour DG enregistré
4. Réunion formelle programmée
5. Réunion formelle tenue
6. Courrier de recevabilité / clôture joint
7. Phase 2 clôturée

The left card should display done count, current step, and a compact checklist just like the preliminary progression pattern.

### Right workspace

Refactor `FormalRequestPhaseWorkspace` from dashboard-like cards into this order:

1. Header metadata: Phase 2 - Demande formelle, statut demande formelle, phase statut, démarrée le, clôturée le, envoi DG, retour DG.
2. Courrier formel: present/missing, source, date réception, reference only if actually available.
3. Circuit DG: non envoyé, envoyé, retour enregistré, décision enregistrée.
4. Réunion formelle: non programmée, programmée, tenue, compte rendu if available.
5. Documents de demande formelle: compact summary, requirement rows, active submission state, replaced history.
6. Statut: next action message.

### Data constraints

- Use only fields currently exposed by `AdminFormalRequestPhaseState`.
- Do not show raw IDs as business references.
- Do not infer unavailable DG review details beyond read-model status/booleans.

## Verification commands run

Not run; planning only.

## Manual checks run

Not run; planning only.

## Known risks / TODOs

- `FormalRequestPhaseWorkspace` currently owns the API fetch; `DossierPhasesTab` needs Phase 2 state for the left progression card. Implementation should avoid duplicate fetches by lifting the Phase 2 state load to `DossierPhasesTab` or by adding a small wrapper that shares state with both the left progression card and right workspace.
- Existing uncommitted OMA-FORMAL-9A implementation files are present in the worktree; adjustment must modify them without reverting unrelated changes.
- Some cached console output shows mojibake; edited source should retain correct UTF-8 French text.

## Next step

Await approval, then implement the alignment adjustment and rerun admin typecheck/build.

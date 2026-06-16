# OMA-FORMAL-9B1B - Admin Phase 2 Physical DG Circuit Actions Planning

Date: 2026-05-27
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan admin Phase 2 action wording and flow corrections so the admin workspace records the physical DG/parapheur circuit after the formal request courrier exists, while presenting admin formal courrier upload only as an outside-portal fallback.

No implementation was performed in this pass.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/tasks/current-task.md`
- latest `exploration-cache/tasks/summaries/*oma-formal*`

## Source files inspected

- `apps/admin/src/pages/dossiers/FormalRequestPhaseWorkspace.tsx`
- `apps/admin/src/pages/dossiers/formal-request-dialogs.tsx`
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/utils/error.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1b-admin-physical-dg-circuit-actions-planning.md`

## Key decisions

- Keep this as an admin frontend slice only.
- Reuse the existing 9B1 API client functions; no new routes or client calls are required.
- Present portal upload as the normal source when present.
- Present admin upload only as the fallback: `Scanner / enregistrer un courrier reçu hors portail`.
- Split DG return scan and DG decision into separate UI actions, because the current combined dialog does not match the physical process and can create partial-failure ambiguity.
- Continue using backend `canSendToDg` as the only enablement source for `Mettre en circuit DG`.
- Keep supporting documents visibly tracking-only and non-blocking.

## API client additions

None planned. Existing functions in `apps/admin/src/lib/api/dossiers.api.ts` already cover:

- `uploadFormalRequestCourrier`
- `sendFormalRequestToDg`
- `recordFormalRequestDgReturn`
- `recordFormalRequestDgDecision`

## UI wording corrections planned

- Replace `Joindre le courrier de demande formelle` with `Scanner / enregistrer un courrier reçu hors portail`.
- Add helper: `À utiliser uniquement si la demande formelle a été reçue physiquement ou scannée en interne. Si le postulant téléverse sa demande depuis le portail, elle apparaîtra automatiquement ici.`
- Missing gate primary message: `En attente du dépôt de la demande formelle par le postulant.`
- `portal_upload` label: `Téléversé par le postulant`.
- `physical_deposit` label: `Dépôt physique`.
- `internal_scan` label: `Scan interne`.
- DG circuit helper: `Imprimez le courrier de demande formelle, placez-le dans le circuit physique DG/parapheur, puis marquez cette étape comme mise en circuit.`
- DG return action: `Enregistrer le retour DG scanné`.
- Decision action: `Enregistrer la décision DG`.

## Actions wired

Planned action surface:

- Missing gate fallback:
  - `Scanner / enregistrer un courrier reçu hors portail`
  - calls existing `/courrier` route with `source=physical_deposit|internal_scan`.
- Gate present:
  - show source and reception date.
- Physical DG circuit:
  - `Mettre en circuit DG`
  - enabled only when `canSendToDg === true`
  - calls existing `/send-to-dg` route.
- DG return:
  - `Enregistrer le retour DG scanné`
  - calls existing `/dg-return` route.
- DG decision:
  - `Enregistrer la décision DG`
  - calls existing `/dg-decision` route.

## Business rules preserved

- Admin never sends `portal_upload`.
- Admin source options remain only `physical_deposit` and `internal_scan`.
- Portal upload remains the normal postulant path.
- Supporting documents do not gate DG placement.
- Backend `canSendToDg` remains authoritative.
- No portal code changes in this slice.
- No backend code changes in this slice.

## Verification commands run

Not run; planning only.

## Verification planned

```bash
cd apps/admin
npx tsc --noEmit
npm run build
```

## Manual checks

Not run; planning only.

## Known risks / TODOs

- Runtime validation requires a live admin session, dossier in Phase 2, and API server.
- Current edited admin files contain mojibake in some French strings; implementation should write corrected UTF-8 labels only in touched UI text.
- Permission gates may hide actions depending on role capabilities.
- The read model does not expose full DG review metadata; UI should not invent unavailable DG details.

## Next step

Await user approval, then implement OMA-FORMAL-9B1B in the admin frontend and run admin typecheck/build.

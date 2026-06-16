# ADMIN-5 Planning - Courriers / Orientation DG Read-only Registry

Date: 2026-05-21

## Objective

Convert `CourriersPage.tsx` from a mock-only page into an API-backed read-only registry for the DG courrier circuit. The page must never expose mutation actions; those remain in `Demandes`.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/05-data/DATA_MODELS.md`
- `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`

## Source files inspected

- `apps/admin/src/pages/CourriersPage.tsx` (full)
- `apps/admin/src/lib/api/requests.api.ts` (full)
- `apps/api/src/modules/requests/request.service.ts` (sanitizeRequest, listAdminRequests)

## Key findings

1. `CourriersPage.tsx` is 100% mock-data driven (`useCourriers`, `useDemandes`, `useDossiers`, `useDgDecisionRecords` from `@/features/aidn`). Zero API calls.
2. `GET /api/v1/admin/requests` already returns all needed fields for the registry view: organization, submittedBy, courrierSource, physicalDeposit, intake dates, dgReview (decision, returnedFromDgAt, returnedScannedDocumentId).
3. `sanitizeRequest()` does NOT include `dossierId` - one-line backend fix needed.
4. `AdminRequest` type in `requests.api.ts` already has `dossierId?: string` - no type change needed.
5. DG circuit status must be derived client-side from `request.status` + `courrierSource` + `physicalDeposit.status`.
6. Default `listAdminRequests` filter already excludes draft/pre-submission statuses - courrier page gets all relevant rows with no extra filter params.

## Gaps found

- `dossierId` missing from `sanitizeRequest` output (backend, trivial)
- `CourriersPage.tsx` needs full rewrite replacing mock hooks with `listRequests()` from `requests.api.ts`
- Column schema must be remapped from `AidnCourrier` (mock) to `AdminRequest` (API)

## Recommended implementation scope

**Option A - Reuse `GET /api/v1/admin/requests`** (chosen).
No new endpoint. No new type. Minimal backend change (one field in `sanitizeRequest`). Full frontend rewrite of `CourriersPage.tsx`.

## Files to change

| File                                               | Change                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/api/src/modules/requests/request.service.ts` | Add `dossierId: toId(request.dossierId)` in `sanitizeRequest()`                         |
| `apps/admin/src/pages/CourriersPage.tsx`           | Full rewrite: replace mock hooks, new columns, new KPIs, new filters, new detail dialog |

## DG circuit status derivation

```typescript
function deriveDgCircuitStatus(r: AdminRequest): string {
  if (r.status === "dossier_opened") return "Dossier ouvert";
  if (r.status === "oriented_to_dn") return "Orienté DN";
  if (r.status === "rejected") return "Annulé DG";
  if (r.status === "initial_sent_to_dg") return "En attente retour DG";
  if (r.courrierSource === "physical_deposit") {
    return r.physicalDeposit?.status === "received"
      ? "Courrier physique reçu"
      : "Dépôt physique prévu";
  }
  return "À imprimer";
}
```

## KPI derivations

- Courriers liés: `items.filter(r => !!r.courrierSource).length`
- Téléversés portail: `items.filter(r => r.courrierSource === 'portal_upload').length`
- Dépôts physiques: `items.filter(r => r.courrierSource === 'physical_deposit').length`
- En attente retour DG: `items.filter(r => r.status === 'initial_sent_to_dg').length`
- Retours DG enregistrés: `items.filter(r => ['oriented_to_dn','rejected','dossier_opened'].includes(r.status)).length`
- Dossiers ouverts: `items.filter(r => r.status === 'dossier_opened').length`
- Annulés DG: `items.filter(r => r.status === 'rejected').length`

## Important route decision:

If `request.dossierId` exists, display a non-clickable badge/text:
“Dossier ouvert”.
Do not link to `/dossiers/:id` until the dossier detail route is confirmed/API-backed.

## Read-only action policy

Allowed: Voir la demande, Voir le dossier DN (when dossierId exists), Voir document initial (indicator only), Voir scan retour DG (indicator only), Actualiser, Filtrer.

Not allowed: Imprimer, Enregistrer réception, Enregistrer retour DG, Ouvrir dossier DN, Demander correction.

## Risks

- `CourriersPage.tsx` currently imports from `@/features/aidn` - those imports must be fully removed (no partial mix of mock + API data).
- Document viewing (initial courrier, DG scan) requires GED surface which is deferred. Show presence/absence indicator only for MVP.
- `/dossiers/:id` route may not exist yet in admin; "Voir le dossier DN" link should be guarded against navigation to a non-existent route.

## Next step

Await approval, then implement:

1. `sanitizeRequest` backend fix (add `dossierId`)
2. Full `CourriersPage.tsx` rewrite
3. Admin build verification

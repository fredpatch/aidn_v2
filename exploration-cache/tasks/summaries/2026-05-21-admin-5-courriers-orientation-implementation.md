# ADMIN-5 Implementation - Courriers / Orientation DG Read-only Registry

Date: 2026-05-21
Status: Complete

## Objective

Convert `CourriersPage.tsx` from a 100% mock-data page into a live API-backed read-only registry for the DG courrier circuit.

## Files changed

| File                                               | Change                                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/requests/request.service.ts` | Added `dossierId: toId(request.dossierId)` to `sanitizeRequest()` - field now appears in all admin request responses |
| `apps/admin/src/pages/CourriersPage.tsx`           | Full rewrite - all mock hooks removed, API-backed data, new columns/KPIs/filters/detail dialog                       |

## Backend change

In `sanitizeRequest()` (line ~202), added one field:

```typescript
dossierId: toId(request.dossierId),
```

This is the only backend change. The existing `GET /api/v1/admin/requests` endpoint already returned all other needed fields (organization, submittedBy, courrierSource, physicalDeposit, intake dates, dgReview). No new route was added.

## Frontend change - CourriersPage.tsx

### Data source

Replaced four mock hooks (`useCourriers`, `useDemandes`, `useDossiers`, `useDgDecisionRecords`) with a single `listRequests({})` call from `@/lib/api/requests.api`. Rows are filtered to those with a `courrierSource` (i.e. requests that have entered the DG circuit).

### DG circuit status derivation

Client-side function `deriveDgCircuitStatus(r: AdminRequest): DgCircuitStatusKey`:

```
dossier_opened         → dossier_ouvert
oriented_to_dn         → oriente_dn
rejected               → annule_dg
initial_sent_to_dg     → attente_retour_dg
physical_deposit+received → courrier_physique_recu
physical_deposit+planned  → depot_physique_prevu
portal_upload (default)   → a_imprimer
```

### KPI cards (7)

| KPI                    | Derivation                                             |
| ---------------------- | ------------------------------------------------------ |
| Courriers liés         | all items with courrierSource                          |
| Téléversés portail     | `courrierSource === 'portal_upload'`                   |
| Dépôts physiques       | `courrierSource === 'physical_deposit'`                |
| En attente retour DG   | `status === 'initial_sent_to_dg'`                      |
| Retours DG enregistrés | `status in [oriented_to_dn, rejected, dossier_opened]` |
| Dossiers ouverts       | `status === 'dossier_opened'`                          |
| Annulés DG             | `status === 'rejected'`                                |

### Table columns

Organisation/Postulant, Type demande, Source courrier (badge), Statut circuit DG (derived badge), Date envoi DG, Décision DG, Date retour DG, Dossier DN (badge only).

### Filters

All client-side:

- Global search (organisation, postulant, type label)
- Source courrier: Toutes / Téléversé portail / Dépôt physique
- Statut circuit DG: full enum select
- Inclure l'historique toggle (default **off** - hides `rejected` and `dossier_opened`)

### Detail dialog

Read-only sections: Demande (org, postulant, type, dates), Circuit DG (source, statut, document initial indicator, dates, decision, retour scan indicator, observations), Dossier DN (badge "Dossier ouvert" if `dossierId` exists, else "Aucun dossier DN").

### Action policy enforced

Allowed: Voir la demande (navigates to `/demandes` with request id in state), Voir détails (opens dialog), Actualiser, Filtrer.

Not present: Imprimer, Enregistrer réception, Enregistrer retour DG, Ouvrir dossier DN, Demander correction.

Dossier DN: non-clickable badge only - no `/dossiers/:id` link until that route is confirmed API-backed.

## Build verification

- `apps/api` - `npm run build` passed (no TS errors)
- `apps/admin` - `npm run build` passed (no TS errors, vite bundle produced)

## Decisions recorded

- Reused `GET /api/v1/admin/requests` (Option A). No dedicated courriers endpoint needed for MVP.
- `dossierId` added to `sanitizeRequest` - benefits all admin consumers, not just this page.
- `/dossiers/:id` navigation deferred per user decision in planning doc - badge-only indicator used instead.
- Mock imports from `@/features/aidn` fully removed from this page (no partial mixing).

## Next phase

No immediate follow-up defined. Candidate next work: ADMIN-6 dossier detail screen (would unlock the "Voir le dossier DN" navigation link from this page).

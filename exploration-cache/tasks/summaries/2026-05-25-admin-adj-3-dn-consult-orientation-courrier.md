# ADMIN-ADJ-3 - DN roles consult scanned DG orientation courrier

Date: 2026-05-25
Phase: implementation
Status: **Complete - typecheck PASS, build PASS**

## Objective

Allow `dn_agent`, `dn_supervisor` (and other roles with `REQUEST_VIEW_ALL`) to consult the scanned DG orientation courrier from the Demandes detail Orientation tab. Read-only consultation only - no circuit permissions restored.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-admin-adj-2-demandes-detail-tabs.md`

## Source files inspected

- `apps/api/src/modules/requests/request.service.ts` - `getAdminRequest`, `sanitizeDgReview`, `downloadAdminDossierDocument` pattern
- `apps/api/src/modules/admin/admin.routes.ts` - existing request routes, permission guards
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` - `downloadAdminDossierDocument` pattern (verify-then-serve)
- `apps/admin/src/lib/api/requests.api.ts` - types, existing API functions
- `apps/admin/src/lib/api/client.ts` - `apiGetBlob` helper
- `apps/admin/src/lib/api/dg-circuit.api.ts` - `downloadDgCircuitTaskDocument` pattern
- `apps/admin/src/pages/RequestsPage.tsx` - Orientation tab content

## Files changed

1. `apps/api/src/modules/requests/request.service.ts` - added `downloadAdminRequestOrientationDocument`
2. `apps/api/src/modules/admin/admin.routes.ts` - added `GET /requests/:id/documents/:documentId` route + import
3. `apps/admin/src/lib/api/requests.api.ts` - added `downloadRequestOrientationDocument`, added `apiGetBlob` import
4. `apps/admin/src/pages/RequestsPage.tsx` - added `ExternalLink` icon + `downloadRequestOrientationDocument` import, `consultOrientationCourrier` handler, updated Orientation tab

## Key decisions

### Permission

Used `REQUEST_VIEW_ALL` for the new backend endpoint. DN roles already hold this permission. No new permission constant needed. No `DG_CIRCUIT_HANDLE` or `COURRIER_REGISTER_PHYSICAL` restored.

### Backend endpoint

`GET /admin/requests/:id/documents/:documentId` guarded by `requirePermission(Permissions.REQUEST_VIEW_ALL)`.

Service function `downloadAdminRequestOrientationDocument`:

- Looks up the DGReview by requestId.
- Verifies the requested documentId matches `dgReview.returnedScannedDocumentId` exactly - prevents accessing arbitrary documents via this route.
- Fetches from storageAdapter and returns buffer + metadata.

### Frontend API

Added `downloadRequestOrientationDocument(requestId, documentId)` using existing `apiGetBlob` client helper. Added `apiGetBlob` to import.

### UI - Orientation tab

Replaced the plain `DetailField label="Scan retour"` with a custom `<dt>/<dd>` block:

- If `dgReview.returnedScannedDocumentId` is set: shows "Consulter le courrier orienté" button (outline, `ExternalLink` icon). Opens blob preview in new tab. Helper text "Consultation facultative avant démarrage de la phase préliminaire." shown only when `canOpenDossier` is true.
- If no scan: shows "Aucun courrier orienté scanné disponible."

### No blocking state added

The "Démarrer la phase préliminaire" footer action is entirely unaffected. Consultation is voluntary and independent.

### Blob preview pattern

Follows exact DgCircuitPage pattern: `window.open('about:blank', '_blank')` before async call, then `URL.createObjectURL(blob)` + redirect. Falls back to a second `window.open` if the pre-opened window was closed.

## Verification commands run

- `apps/api`: `npx tsc --noEmit` → PASS
- `apps/api`: `npm run build` → PASS
- `apps/admin`: `npx tsc --noEmit` → PASS
- `apps/admin`: `npm run build` → PASS (1429.65 kB / 413.20 kB gzip)

## Manual checks pending

- With `oriented_to_dn` request that has a scanned return doc: Orientation tab shows the button, click opens document in new tab.
- With no scanned doc: shows "Aucun courrier orienté scanné disponible."
- DN agent/supervisor cannot reach `/circuit-dg` route.
- "Démarrer la phase préliminaire" button still appears and works independently.

## Known risks / TODOs

- `URL.createObjectURL` blob URLs are not revoked after use (same as DgCircuitPage pattern - acceptable, short-lived tabs reclaim memory on close).
- If a DN role requests a documentId that doesn't match the dgReview's returnedScannedDocumentId, the backend returns 403 - correct by design.

## Next step

Runtime validation in browser. Awaiting next task from `prompt.md`.

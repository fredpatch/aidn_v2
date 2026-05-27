# OMA-FORMAL-9B1A - Portal Phase 2 Formal Request Upload Planning

Date: 2026-05-27
Status: **Planning complete - awaiting implementation approval**

## Objective

Plan the postulant-facing Phase 2 formal request courrier upload from the portal.

The normal actor for this courrier is the postulant. The portal must upload the formal request courrier with `source=portal_upload`; it must not expose internal source choices, DG circuit controls, DG decisions, or scanned-return wording.

No implementation was performed in this pass.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
- `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
- `exploration-cache/tasks/current-task.md`
- latest OMA-FORMAL summary list under `exploration-cache/tasks/summaries/`

## Source files inspected

- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/lib/api/http.ts`
- `apps/portal/src/lib/routes.ts`
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/oma-phases/formal-request.service.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts`

`apps/portal/src/pages/ActionsRequisesPage.tsx` was checked and does not exist.

## Files changed

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-27-oma-formal-9b1a-portal-formal-request-upload-planning.md`

## Cache findings

- `API_ROUTES.md` confirms `POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier`.
- `API_ROUTES.md` confirms portal upload hardcodes/uses `source=portal_upload`, is ownership-scoped, and duplicate formal request courrier returns `409`.
- `PORTAL_APP_MAP.md` confirms `RequestDetailPage` is the current portal request/detail workspace and already has an `Actions requises` tab and Sonner toasts.
- `BUILD_AND_TEST_COMMANDS.md` confirms portal verification commands and notes the same Vite/Tailwind Windows native binary build caveat.

## Source findings

- `portal.routes.ts` confirms the exact route and multipart field:
  - `POST /api/v1/portal/dossiers/:id/phases/formal-request/courrier`
  - middleware field: `file`
  - body accepted: optional `officialReference`, optional `notes`
  - service payload sets `source: "portal_upload"`
- `formal-request.service.ts` verifies portal ownership through `getOwnedDossier`, rejects non-portal sources for postulants, creates the gate courrier/submission, and returns a minimal portal-safe state.
- `portal.api.ts` already has `portalPostForm` and upload patterns for initial courrier and pre-evaluation form.
- `RequestDetailPage.tsx` already loads `getPortalDossier(request.dossierId)`, renders the `Actions requises` tab, uploads the pre-evaluation form, and uses `toast.success`.
- `getPortalDossier` in `oma-phase.service.ts` currently returns only `dossier` and `preliminary`; it does not expose portal-safe Phase 2 formal request state.

## Key decisions

- Add a small portal-safe formal request block to `getPortalDossier` so the UI can know whether Phase 2 is waiting for the formal request courrier and whether it has already been deposited.
- Keep the portal API function narrowly scoped: `uploadFormalRequestCourrier(dossierId, formData)`.
- Add the upload action inside the existing `Actions requises` tab of `RequestDetailPage.tsx`.
- Keep the dialog/form simple: PDF/file input plus optional notes only.
- Keep portal wording simple and avoid internal DG circuit, DG decision, source, physical-deposit, and scan-interne wording.
- Do not touch admin workflow actions in this slice.

## Implementation details planned

### Backend read-model extension

Minimal backend change planned because the existing portal detail read model cannot determine whether the formal request gate is missing:

- Extend `getPortalDossier` response with a portal-safe `formalRequest` object:
  - `status`
  - `portalLabel`
  - `hasFormalRequestCourrier`
  - `canUploadFormalRequestCourrier`
- Derive `canUploadFormalRequestCourrier` from:
  - preliminary phase closed;
  - formal request phase exists and is not closed;
  - no `formalRequestCourrierId`.
- Use portal labels only:
  - `En attente de dépôt de la demande formelle`
  - `Demande formelle déposée`
  - `En traitement par l'ANAC`
  - `En attente d'orientation administrative`

### Portal API

- Update `apps/portal/src/lib/api/portal.api.ts`:
  - extend `PortalDossierDetail` type with `formalRequest`;
  - add `uploadFormalRequestCourrier(dossierId: string, formData: FormData)`.

### Portal UI

- Update `RequestDetailPage.tsx`:
  - add a `formalRequestFileRef`;
  - add formal upload loading/error state;
  - compute `hasActionRequired` from existing correction/pre-eval actions plus `dossierDetail.formalRequest.canUploadFormalRequestCourrier`;
  - render the action card in the `Actions requises` tab:
    - title: `Action requise`
    - heading/action: `Déposer la demande formelle`
    - helper text from the prompt;
    - button: `Téléverser le courrier formel`
  - submit multipart field `file` plus optional `notes`;
  - on success: clear file input, refresh dossier detail, show success toast, and keep internal DG wording hidden.
- Optionally show a simple deposited state:
  - `Demande formelle déposée`
  - no admin/DG controls.

## Business rules preserved

- Portal upload is ownership-scoped by backend.
- Portal source remains `portal_upload`; no source selector is shown.
- The formal request courrier is the only Phase 2 blocking gate.
- Supporting documents remain separate and non-blocking.
- No DG circuit, return scan, or decision controls are shown in the portal.
- No admin workflow changes are planned.

## Verification commands planned

After implementation approval:

```bash
cd apps/portal
npx tsc --noEmit
npm run build
```

## Manual checks planned

- Portal request detail loads.
- Phase 2 action appears when preliminary phase is closed and formal courrier is missing.
- Upload succeeds with multipart field `file`.
- Request/dossier detail refreshes after upload.
- Action disappears or becomes `Demande formelle déposée`.
- Portal does not expose DG circuit controls, source choices, internal scan, or DG decision wording.
- Admin Phase 2 read workspace shows the gate present after refresh.
- No admin workflow actions are added.

## Known risks / TODOs

- A minimal backend serializer/type change is needed for correct portal display; otherwise the portal cannot know whether the formal request gate already exists after refresh.
- Runtime checks need a live portal session and a dossier with Phase 1 closed.
- Existing files contain mojibake in some French text; implementation should keep edits scoped and use correct French in new strings.

## Next step

Await user approval, then implement OMA-FORMAL-9B1A.

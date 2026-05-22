# PORTAL-H1A — Postulant Portal API + UI Audit

Date: 2026-05-22
Status: **Complete — read-only, no implementation**

---

## 1. Files Inspected

### Portal frontend
- `apps/portal/src/pages/PortalDashboardPage.tsx`
- `apps/portal/src/pages/MyRequestsPage.tsx`
- `apps/portal/src/pages/RequestDetailPage.tsx`
- `apps/portal/src/lib/api/portal.api.ts`
- `apps/portal/src/components/RequestStatusBadge.tsx`

### Backend
- `apps/api/src/modules/portal/portal.routes.ts`
- `apps/api/src/modules/requests/request.service.ts` (lines 1–280, status label fn, getPortalRequest)
- `apps/api/src/modules/notifications/notification.model.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.service.ts` (downloadPortalDossierDocument, getPortalDossier)

### Cache files
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
- `exploration-cache/04-backend/API_ROUTES.md`
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`

---

## 2. Current Portal Route Map

| Route | Page | Access |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/demande-compte` | `AccountRequestPage` | Public |
| `/connexion` | `LoginPage` | Public |
| `/tableau-de-bord` | `PortalDashboardPage` | Protected |
| `/demandes` | `MyRequestsPage` | Protected |
| `/demandes/nouvelle` | `NewRequestPage` | Protected |
| `/demandes/:id` | `RequestDetailPage` | Protected |
| `*` | `NotFoundPage` | Public fallback |

---

## 3. Current Portal API Map

All calls in `portal.api.ts`:

| Method | Endpoint | Used by |
|---|---|---|
| POST | `/api/v1/portal/auth/login` | LoginPage |
| GET | `/api/v1/portal/auth/me` | PortalAuthContext session restore |
| POST | `/api/v1/portal/auth/logout` | PortalHeader |
| POST | `/api/v1/portal/account-requests` | AccountRequestPage |
| POST | `/api/v1/portal/requests` | NewRequestPage |
| GET | `/api/v1/portal/requests` | MyRequestsPage, PortalDashboardPage |
| GET | `/api/v1/portal/requests/:id` | RequestDetailPage |
| PATCH | `/api/v1/portal/requests/:id` | RequestDetailPage |
| POST | `/api/v1/portal/requests/:id/courrier` | (compatibility, not directly called by UI) |
| POST | `/api/v1/portal/requests/:id/physical-deposit` | (compatibility, not directly called by UI) |
| POST | `/api/v1/portal/requests/:id/submit` | RequestDetailPage (combined submit) |
| GET | `/api/v1/portal/dossiers/:id` | RequestDetailPage (when dossierId set) |
| GET | `/api/v1/portal/dossiers/:id/documents/:documentId` | RequestDetailPage (download) |
| POST | `/api/v1/portal/dossiers/:id/preliminary/upload-pre-evaluation-form` | RequestDetailPage |

**Missing API endpoints (no portal route exists):**
- Notifications list / mark-read
- Standalone meetings/calendar list
- Status history / audit timeline for the postulant
- Document list for a request or dossier (all downloads are by known documentId only)

---

## 4. Data Consumed by Detail Page (`RequestDetailPage`)

### From `getRequest(id)` → `{ request, courrier?, document? }`

**`PortalRequest`** (all fields passed to UI):
- `id`, `organizationId`, `submittedById`, `requestType`, `subject`, `message`
- `status`, `portalStatusLabel`
- `courrierSource`, `initialCourrierId`, `initialDocumentId`, `dossierId`
- `physicalDeposit` (nested: `declaredAt`, `status`, `expectedDepositDate`, `physicalDepositDate`, `location`, `notes`)
- `submittedAt`, `createdAt`, `updatedAt`
- ⚠️ **`intake`** (see security/overexposure section below)

**`PortalCourrier`**: `id`, `requestId`, `type`, `source`, `physicalDepositDate`, `uploadedAt`, `documentId`, `registeredById`, `notes`

**`PortalDocument`**: `id`, `ownerType`, `ownerId`, `category`, `documentType`, `title`, `fileName`, `mimeType`, `fileSize`, `visibility`, `status`, `version`, `uploadedAt`

### From `getPortalDossier(dossierId)` → `PortalDossierDetail`

- `dossier`: `id`, `dossierNumber`, `dossierType`, `status`, `openedAt`
- `preliminary`: `status`, `portalLabel`, `preEvaluationFormDocumentId`, `firstMeetingReportDocumentId` (only if `postulant_visible`), `hasCompletedForm`, `canSubmitForm`, `firstMeeting`, `preliminaryMeeting`
- `PortalDossierMeeting`: `scheduledAt`, `location`, `status`, `notes`

---

## 5. Missing API Contracts

### A. Notifications (HIGH PRIORITY)
- `NotificationModel` records exist (`recipientUserId`, `title`, `message`, `relatedType`, `relatedId`, `status: unread|read`)
- Backend creates notifications on: `request-correction`, `mark-printed-for-dg`, `record-dg-return`, `open-dossier-dn`, `oriented-to-dn` actions
- **No portal GET endpoint to list or read notifications**
- Dashboard `Notifications` card is hardcoded to `value: 0`
- Required contract: `GET /api/v1/portal/notifications?status=unread` → `{ items: [{ id, title, message, relatedType, relatedId, status, createdAt }] }`
- Required contract: `POST /api/v1/portal/notifications/:id/read` (mark-read)

### B. Meetings (MEDIUM)
- Meetings are partially exposed via `getPortalDossier` (as `firstMeeting`, `preliminaryMeeting`)
- No dedicated meeting list endpoint
- No calendar-style query (`GET /api/v1/portal/meetings`)
- The `MeetingModel` supports: `scheduledAt`, `location`, `status`, `notes`, `meetingType`
- Current exposure is read-only and embedded in dossier detail — adequate for now

### C. Actions Requises (LOW — backend-derived)
- Dashboard derives `actionsRequises` from `listRequests()` filtered by `status === "intake_requires_correction"`
- This is correct but requires a full list fetch just for counts
- Required contract (future): `GET /api/v1/portal/stats` → `{ pendingActions, unreadNotifications, activeDossiers }` (avoid full list load on dashboard)

### D. Status History / Timeline (MEDIUM)
- No endpoint exposes a status transition history to the postulant
- The `audit_logs` records exist on admin side but no portal equivalent
- Required for the future "Historique" tab in the two-panel design

### E. Document List (LOW)
- No `GET /api/v1/portal/requests/:id/documents` or `GET /api/v1/portal/dossiers/:id/documents`
- Currently all downloads use known `documentId` values embedded in model fields
- Adequate for preliminary phase; will be needed for formal request phase

---

## 6. Security / Ownership Concerns

### ✅ Enforced properly
- `listPortalRequests`: queries with `{ submittedById: portalUser.userId }` — postulant sees only own requests
- `getPortalRequest` / `updatePortalRequest` / `uploadPortalRequestCourrier` / `declarePortalPhysicalDeposit` / `submitPortalRequest`: all call `getOwnedRequest` which enforces `submittedById`
- `getPortalDossier` / `downloadPortalDossierDocument` / `uploadCompletedPreEvaluationForm`: enforce `postulantUserId` ownership
- `downloadPortalDossierDocument` enforces `doc.visibility === "postulant_visible"` → 403 otherwise
- `getPortalDossier` only exposes `firstMeetingReportDocumentId` when the document has `visibility === "postulant_visible"` (checked in service)

### ⚠️ Overexposure — `intake` object in portal response
- `sanitizeRequest` (used in `getPortalRequest`) includes `intake: sanitizeIntake(...)` in its output
- `sanitizeIntake` returns: `startedAt`, `startedById`, `startedBy`, `correctionRequestedAt`, `correctionRequestedById`, `correctionRequestedBy`, `correctionReason`, `printedForDgAt`, `printedForDgById`, `printedForDgBy`, `sentToDgAt`, `sentToDgById`, `sentToDgBy`, `notes`
- These are internal administrative process fields (who reviewed, when printed, who sent to DG)
- They should **not be exposed** to the postulant via the portal
- **Fix**: Strip `intake` from `getPortalRequest` and `listPortalRequests` responses; keep it only in `getAdminRequest`

### ⚠️ `PortalCourrier` overexposure (minor)
- `sanitizeCourrier` returns `registeredById`, `officialReference`, `scannedAt` — admin-only tracking fields not useful to the postulant
- Not a hard security risk (no PII, IDs are MongoDB ObjectIds), but clean API design would strip them

---

## 7. UX Problems Confirmed from Source

### A. Status label divergence (frontend vs backend)
`RequestStatusBadge.tsx` has a local `statusLabels` map that diverges from the backend `portalStatusLabel()` function:

| Status | Backend label | Frontend label |
|---|---|---|
| `initial_dg_returned` | "Dossier en cours de traitement" (default) | "En cours de traitement administratif" |
| `initial_dg_decision_recorded` | "Dossier en cours de traitement" (default) | "En cours de traitement administratif" |
| `reoriented` | "En traitement" | "En cours de traitement administratif" |
| `submitted` (physical_deposit) | "Demande recue - depot physique prevu" | "Demande reçue" |

The frontend `label` prop on `RequestStatusBadge` takes the backend-computed `portalStatusLabel` when available (from API response), but the local `statusLabels` map is still used as fallback via `getRequestStatusLabel()`. These divergences create risk when the prop is absent.

### B. `MyRequestsPage` — flat list, no split view
- Simple vertical list with no left/right split
- No sorting or filtering UI (API supports `status`, `requestType`, `search`, `from`, `to` filters — not wired in UI)
- Status badge uses `label` from API ✓, but row has no "dossier" indicator when `dossierId` is set

### C. `PortalDashboardPage` — hardcoded Notifications = 0
- Card always shows `0` for notifications
- No link from dashboard cards to the corresponding pages
- "Actions requises" count from `status === "intake_requires_correction"` only — does not count pre-eval form actions from dossier state

### D. `RequestDetailPage` — single long vertical scroll
- No tabs: all sections (Informations, Courrier initial, Submit, Dossier DN) stacked vertically
- `DossierDnSection` conditionally rendered when `request.dossierId` is set — correct
- `isSubmitted` banner correctly suppressed when `dossierId` set (`isSubmitted && !request.dossierId`)
- `portalStatusGuidance` map in the frontend contains hardcoded guidance strings — should come from backend

### E. French accent inconsistencies
- `MyRequestsPage`: "Aucune demande enregistree." (missing accents)
- `RequestDetailPage`: "Demande mise a jour.", "Demande soumise avec succes.", "Message complementaire", "Aucun courrier ajoute", "Date prevue de depot"
- Backend `portalStatusLabel`: "Demande recue - depot physique prevu" (missing accents)

### F. No Sonner / toast feedback
- Success/error are shown as inline banners — no toast library integrated
- Portal app does not have `sonner` installed

---

## 8. Proposed API Slice PORTAL-H1B

**Title**: Portal API hardening — intake strip, notifications list

**Scope** (backend-only):
1. Remove `intake` from `sanitizeRequest` output when called by portal functions (`getPortalRequest`, `listPortalRequests`). Create a `sanitizePortalRequest` variant without the `intake` field.
2. Add `GET /api/v1/portal/notifications` route → lists `unread` notifications for the current postulant, sorted by `createdAt` desc, limited to 20.
3. Add `POST /api/v1/portal/notifications/:id/read` route → marks a single notification as read.
4. Fix backend `portalStatusLabel`: add explicit cases for `initial_dg_returned`, `initial_dg_decision_recorded`, `dossier_opened`; fix accent on `submitted` physical deposit label.
5. Remove `registeredById`, `officialReference`, `scannedAt` from `sanitizeCourrier` output in portal context (or create `sanitizePortalCourrier`).

---

## 9. Proposed UI Slice PORTAL-H1C

**Title**: Portal UX redesign — two-panel Mes demandes + tabbed detail

**Scope** (frontend-only after PORTAL-H1B):

### `MyRequestsPage` → two-panel split
- Left panel: clickable list of requests (shadcn `Card` or alert-1-style rows with `border-l-4` accent per status tone)
- Right panel: inline detail (removes need to navigate to `/demandes/:id` for basic info)
- Filter tabs: Toutes / En cours / Action requise / Terminées
- Keep `/demandes/:id` for deep link / mobile fallback

### `RequestDetailPage` → shadcn Tabs
- **Résumé**: status badge, dates, type/subject, submission info
- **Courrier initial**: current upload/deposit section (collapsed post-submit)
- **Actions requises**: shown only when `status === "intake_requires_correction"` or pre-eval form available
- **Dossier**: current `DossierDnSection` (meetings, form, downloads)
- **Historique**: placeholder tab (no API yet)

### `PortalDashboardPage`
- Wire Notifications card to `GET /api/v1/portal/notifications?status=unread` count
- Add link on each card to the corresponding page
- "Actions requises" count: combine `intake_requires_correction` requests + dossiers with `canSubmitForm=true`

### French accent sweep
- Fix all missing accents in portal page strings

### Sonner integration
- Install `sonner`, add `<Toaster />` to `PortalLayout`, replace success inline banners with toasts for: update, submit, upload pre-eval form

---

## 10. Cache Files to Update After Implementation

- `exploration-cache/03-frontend/PORTAL_APP_MAP.md` — two-panel layout, tabs, sonner
- `exploration-cache/04-backend/API_ROUTES.md` — add notifications routes
- `exploration-cache/05-data/DATA_MODELS.md` — sanitizePortalRequest vs sanitizeRequest split
- `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md` — notifications flow, actions requises expansion
- `exploration-cache/QUICK-REFERENCE.md` — update with H1B/H1C notes

---

## Audit Conclusions Summary

| Question | Finding | Severity |
|---|---|---|
| Notifications real/mocked/partial? | Backend creates them, no portal read endpoint | HIGH |
| Meetings exposed to portal? | Partially, via dossier detail only | MED |
| Actions requises from backend? | Yes (status field), but dashboard count incomplete | MED |
| Status labels simplified? | Partially — divergence between backend/frontend maps | MED |
| Ownership guards? | Properly enforced on all portal endpoints | ✅ OK |
| Document visibility? | Enforced: visibility check + dossier ownership | ✅ OK |
| Overexposed fields? | `intake` object in portal response leaks admin fields | HIGH |
| Portal accent quality? | Multiple missing accents in page strings | LOW |

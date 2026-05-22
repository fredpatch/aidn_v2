# DEV-RESET-1 Implementation Summary

Date: 2026-05-21
Status: Complete - all builds PASS (API tsc PASS, Admin tsc+vite PASS)

## Objective

Add a beta/dev data reset tool that lets admins wipe workflow/business data during beta testing without touching identity/access data.

## Files changed

### Backend

**`apps/api/src/shared/permissions/permissions.ts`**

- Added `DEV_DATA_RESET: "DEV_DATA_RESET"` - covered by `allPermissions` so BOOTSTRAP_ADMIN and ADMIN have it automatically

**`apps/api/src/shared/config/env.ts`**

- Added `allowDevDataReset: process.env.ALLOW_DEV_DATA_RESET === "true"` - defaults false

**`apps/api/src/modules/admin/dev-reset.service.ts`** (NEW)

- Safety guards: internal actor check, `allowDevDataReset` check, not-production check, confirmation text `"RESET AIDN TEST DATA"`
- Deletes in parallel: requests, courriers, dossiers, oma_phases, documents, meetings, dg_reviews
- Optionally: notifications, audit_logs (both opt-in default true)
- Optionally: readdir(storageRoot) + rm each entry (default false - irreversible)
- Console.warn before audit deletion to leave a trace
- Returns `{ ok, counts, deletedFiles }`

**`apps/api/src/modules/admin/admin.routes.ts`**

- Added `POST /dev/reset-test-data` behind `requirePermission(Permissions.DEV_DATA_RESET)`

**`apps/api/.env.example`**

- Documented `ALLOW_DEV_DATA_RESET=false` with comment

### Admin Frontend

**`apps/admin/src/lib/api/dev.api.ts`** (NEW)

- `resetTestData(payload)` → `POST /api/v1/admin/dev/reset-test-data`
- Types: `ResetTestDataPayload`, `ResetTestDataResult`

**`apps/admin/src/pages/SettingsPage.tsx`**

- Added `DevResetSection` component:
  - Hidden if user lacks `DEV_DATA_RESET` permission
  - Amber info box listing deleted vs preserved collections
  - Checkboxes: includeAuditLogs (true), includeNotifications (true), deleteUploadedFiles (false)
  - Confirmation text input - button disabled until exact phrase entered
  - Dialog confirmation before executing
  - Shows per-collection counts on success
- Wired into `SettingsPage` as last section

## Key decisions

- `document_templates` preserved - may become reusable admin assets
- `deleteUploadedFiles` defaults false - file deletion is irreversible, explicit opt-in required
- Confirmation phrase hard-coded in both service and UI: `"RESET AIDN TEST DATA"`
- Feature disabled by default via env flag; also blocked in `NODE_ENV=production`

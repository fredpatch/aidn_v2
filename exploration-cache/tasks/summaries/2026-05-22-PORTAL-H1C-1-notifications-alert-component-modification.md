# PORTAL-H1C-1 — Notifications Alert Component

Date: 2026-05-22
Status: **Complete — typecheck PASS, lint PASS, build PASS**

## Objective

Replace the raw `<article>` notification rows in `NotificationsPage` with a reusable `Alert` component, adapting the uploaded `alert-1` shadcn-style component to portal conventions (no CVA, no shadcn, no new deps).

## Cache files read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`

## Source files inspected

- `apps/portal/package.json` — confirmed: no CVA, no cn, no shadcn
- `apps/portal/src/components/` (glob) — flat structure, 6 components, no `ui/` subfolder
- `apps/portal/src/pages/NotificationsPage.tsx` — prior session read

## Key decisions

- **No `class-variance-authority`** — portal is too lean; simple typed `Record<variant, Record<appearance, string>>` used instead
- **No `cn` utility** — plain template literal composition (`${base} ${classes}`)
- **No `button-1` dependency** — close/action uses native `<button className="btn btn-secondary">` per existing portal pattern
- **Flat path** — `src/components/Alert.tsx`, not `src/components/ui/alert-1.tsx`, to match existing convention
- **No new deps installed** — zero dependency footprint change

## Files created

- `apps/portal/src/components/Alert.tsx` — exports `Alert`, `AlertIcon`, `AlertContent`, `AlertTitle`, `AlertDescription`, `AlertToolbar`
  - Variants: `info` | `secondary` | `warning` | `danger`
  - Appearances: `light` | `outline`

## Files modified

- `apps/portal/src/pages/NotificationsPage.tsx`
  - Import: `Alert`, `AlertIcon`, `AlertContent`, `AlertTitle`, `AlertDescription`, `AlertToolbar`
  - Unread rows → `<Alert variant="info" appearance="light">` with Bell icon (sky-500)
  - Read rows → `<Alert variant="secondary" appearance="outline">` with Bell icon (slate-400)
  - Error banner → `<Alert variant="danger" appearance="light">`
  - List layout: `divide-y` container replaced with `flex flex-col gap-2` (each item is its own card)
  - All functional behavior preserved: markRead, markAllRead, Sonner toasts, loading/error/empty states

## Alert component mapping

| Notification state | variant | appearance | Bell color |
|--------------------|---------|------------|------------|
| Unread | `info` | `light` | `text-sky-500` |
| Read | `secondary` | `outline` | `text-slate-400` |
| Error banner | `danger` | `light` | — |

## Verification

- `npm run typecheck` — PASS
- `npm run lint` — PASS (lint script = tsc --noEmit)
- `npm run build` — PASS (324 kB JS / 97 kB gzip)

## Manual checks pending

- Open `/notifications` in browser and verify:
  - Unread alerts render with sky-50 background, sky Bell icon, "Marquer comme lu" button
  - Read alerts render with subtle outline border, slate Bell icon, no action button
  - "Tout marquer comme lu" button works and clears to read style
  - Sonner toasts fire on mark-read and mark-all-read
  - Empty state still renders with large Bell icon
  - No broken imports

## Known risks / TODOs

- `warn`/`danger` variants exist in Alert but unused in NotificationsPage (available for future use)
- Historique tab in `RequestDetailPage` is still a placeholder — future timeline API needed

## Next step

Awaiting next task from `prompt.md`.

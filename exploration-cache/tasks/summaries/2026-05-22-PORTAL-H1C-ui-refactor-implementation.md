# PORTAL-H1C - Portal UI Refactor Implementation

Date: 2026-05-22
Status: **Complete - typecheck PASS, build PASS**

## What was done

### 1. Notification API methods - `portal.api.ts`

Added three typed exports:

- `PortalNotification` / `PortalNotificationStatus` types
- `listPortalNotifications({ status?, limit? })` → `{ items, unreadCount }`
- `markPortalNotificationRead(id)` → `{ notification }`
- `markAllPortalNotificationsRead()` → `{ updatedCount }`

### 2. Route - `lib/routes.ts`

Added `notifications: "/notifications"`.

### 3. Sonner - `PortalLayout.tsx`

Installed `sonner` via npm; added `<Toaster position="bottom-right" richColors />` to layout.

### 4. `NotificationsPage.tsx` (CREATED)

Full notifications page:

- List of all notifications with unread/read dot indicator
- Per-item "Marquer comme lu" button (disabled while busy)
- "Tout marquer comme lu" button visible only when `unreadCount > 0`
- Empty state with Bell icon
- Sonner `toast.success()` on mark-read and mark-all-read
- French: "Notification marquée comme lue." / "Toutes les notifications sont marquées comme lues."

### 5. `RequestDetailPage.tsx` (REWRITTEN - tabbed)

Replaced 895-line vertical scroll with 5-tab layout:

- **Résumé**: status guidance banner, info fields, edit form (`toast.success("Demande mise à jour.")`)
- **Courrier initial**: upload/deposit mode + submit button (`toast.success("Demande soumise avec succès.")` → switches to Résumé tab)
- **Actions requises**: correction notice + pre-eval form upload (`toast.success("Formulaire soumis avec succès.")`)
- **Dossier**: dossier reference, meetings table, document downloads (disabled tab when no dossierId)
- **Historique**: placeholder message
- Tab bar: amber dot on "Actions requises" when `hasActionRequired`
- All success states use Sonner toasts; errors remain inline

### 6. `MyRequestsPage.tsx` (REFACTORED - two-panel)

- Left panel: clickable list (320px on lg) with action required indicator (amber AlertCircle) and dossier open indicator (emerald FolderOpen)
- Selected item highlighted with `bg-slate-950 text-white`
- Right panel: `RequestPreviewPanel` showing type, subject, status badge, message preview, date, dossier status, action required banner, and "Ouvrir la demande" link
- First item auto-selected on load
- French accents fixed: "Aucune demande enregistrée." / "Créez une nouvelle demande…"
- Error message: "Veuillez réessayer."

### 7. `PortalDashboardPage.tsx` (UPDATED - real counts + links)

- Fetches both `listRequests()` and `listPortalNotifications({ status: "unread" })` in parallel
- Real unread notification count shown on "Notifications" card
- All three stat cards are `<Link>` elements → `/demandes` or `/notifications`
- Hover: `hover:bg-slate-100` transition
- Fixed "Organisation liée" (was: "Organisation liee")

### 8. `NewRequestPage.tsx` (accent sweep)

- "Sélectionner un type" (was: "Selectionner")
- "Message complémentaire" (was: "Message complementaire")
- "Créez un brouillon de demande…" (was: "Creez")
- "minimum 3 caractères" (was: "3 caracteres")
- "Veuillez réessayer." (was: "reessayer")
- "Création…" / "Créer le brouillon" (was: "Creation..." / "Creer")

### 9. `PortalSidebar.tsx` (nav links + accent)

- "Actions requises" → `portalRoutes.requests`
- "Notifications" → `portalRoutes.notifications`
- "Se déconnecter" (was: "Se deconnecter")

### 10. `App.tsx` - route for `/notifications`

Added `<Route path={portalRoutes.notifications} element={<NotificationsPage />} />`

## Builds

- Portal typecheck: PASS
- Portal build: PASS (324 kB JS, 17 kB CSS)

## Constraints respected

- No shadcn used (portal uses custom CSS: `surface`, `btn`, `control`, `field`)
- No standalone meetings calendar, timeline API, document list API, or portal stats API
- DG/DN internal details not exposed to postulants
- `Historique` tab is a placeholder pending a future timeline API

# ADMIN-ADJ-2 - Demandes detail panel tabs

Date: 2026-05-25
Phase: implementation
Status: **Complete - typecheck PASS, build PASS**

## Objective

Replace the stacked `DetailSection` blocks in the Demandes right panel with a `Card + Tabs` layout. Rename visible "Retour DG" section to "Orientation". Improve panel compactness and scannability.

## Cache files read

- `exploration-cache/manifest.json`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-admin-adj-1-permissions-demandes-split-view.md`

## Source files inspected

- `apps/admin/src/pages/RequestsPage.tsx` (just written in ADMIN-ADJ-1)
- `apps/admin/src/components/ui/tabs.tsx` - exists, uses `@radix-ui/react-tabs`
- `apps/admin/src/components/ui/card.tsx` - exists, standard shadcn Card
- `apps/admin/package.json` - `@radix-ui/react-tabs@^1.1.13` already installed

## Files changed

1. `apps/admin/src/pages/RequestsPage.tsx`

## Key decisions

### Tabs component

No new component needed - `tabs.tsx` already existed with `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`. Added imports from `'../components/ui/card'` and `'../components/ui/tabs'`.

### Layout structure

Right panel replaced: `<div className="rounded-md border...">` → `<Card>` with:

- `<CardHeader>`: compact summary (status badge, action badge, title, org, postulant, source)
- `<CardContent>`: `<Tabs>` with 6 tabs (`Tabs defaultValue="demande"`)
- `<CardFooter>`: all contextual action buttons

### TabsList overflow

Used `flex h-auto flex-wrap gap-0.5` on TabsList to allow wrapping when 6 tabs exceed panel width. Each `TabsTrigger` uses `text-xs px-2.5 py-1` for compact display.

### Tab structure

| Tab value    | Label                | Fields                                                      |
| ------------ | -------------------- | ----------------------------------------------------------- |
| demande      | Demande              | type, statut, création, soumission, objet, message          |
| postulant    | Postulant            | nom, email, téléphone                                       |
| organisation | Organisation         | nom canonique, email, téléphone, adresse légale             |
| courrier     | Courrier             | source, document, ref officielle, dates, notes              |
| verification | Vérification interne | started, by, correction, motif, printed, by, circuit, notes |
| orientation  | Orientation          | date retour, décision, observations, scan retour            |

"Retour DG" renamed to "Orientation" (UI label only, no backend change).

### DetailField update

Added optional `className` prop to `DetailField` for `sm:col-span-2` spanning. Removed unused `DetailSection` component.

### Actions ordering in CardFooter

Left-to-right: Demander correction (destructive) → Enregistrer réception → Imprimer → Enregistrer le retour DG → Démarrer la phase préliminaire (primary, rightmost).

## Verification commands run

- `apps/admin`: `npx tsc --noEmit` → PASS
- `apps/admin`: `npm run build` → PASS (1428 kB / 413 kB gzip)

## Manual checks pending

- Tab switching works, content updates correctly.
- CardHeader compact summary visible at all times.
- `Prêt pour phase préliminaire` badge visible when applicable.
- TabsList wraps cleanly on narrower screens.
- CardFooter actions visible and functional.

## Known risks / TODOs

- No responsive breakpoint below `lg` has been tested - on mobile/tablet the split-view stacks and the right panel Card shows below the list. This is acceptable per the task spec.

## Next step

Runtime validation in browser. Awaiting next task from prompt.md.

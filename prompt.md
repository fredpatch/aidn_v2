## CACHE-FIRST PROTOCOL - ALWAYS FOLLOW

When processing this task, you MUST:

### 1. Read Cache First

Always start by reading:

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md` if relevant
- `exploration-cache/archive/summaries/**` only when needed as source material

### 2. Answer From Cache When Possible

If the answer exists in cache:

- cite the cache source
- answer from cache
- stop there unless the current task explicitly requires implementation

Format:
FROM CACHE: [file path] - [finding]

### 3. Only Explore Gaps

If cache is incomplete, state:

CACHE GAP: [specific missing info]

Then:

- explore only the missing path(s)
- never re-explore cached paths without reason
- keep exploration narrow

4. Update Cache After Each Discovery
   - After any meaningful new finding:
   - update the relevant `exploration/pattern/task file`
   - update `QUICK-REFERENCE.md` if the finding is cross-cutting
   - update `manifest.json` only if the pass requires manifest changes
   - update `exploration-cache/tasks/current-task.md`

5. Token Saving Rules
   - Do not repeat large cached content in the response
   - Use file references instead
   - Do not re-read files already read this session unless needed
   - Keep responses brief and grounded
   - Do not broaden scope silently
   - One task only

### SESSION START PROCEDURE

At the beginning of the task:

1. Read this prompt.md
2. Read exploration-cache/manifest.json
3. Read exploration-cache/QUICK-REFERENCE.md
4. Check whether relevant answer/state already exists in:
   `exploration-cache/03-frontend/ADMIN_APP_MAP.md`
   `exploration-cache/03-frontend/PORTAL_APP_MAP.md`
   `exploration-cache/04-backend/API_ROUTES.md`
   `exploration-cache/05-data/DATA_MODELS.md`
   `exploration-cache/06-workflows/ADMIN_INTAKE_WORKFLOW.md`
   `exploration-cache/06-workflows/PORTAL_REQUEST_WORKFLOW.md`
   `exploration-cache/09-qa/BUILD_AND_TEST_COMMANDS.md`
   `exploration-cache/tasks/current-task.md`
5. State cache status briefly.
6. Proceed only with the current objective.

Expected cache status block:

## CACHE STATUS

- Services explored: [brief list]
- App areas explored: [brief list]
- Packages explored: [brief list]
- Patterns available: [brief list]
- Last update: [timestamp]
- Pending gaps: [brief list]

## CRITICAL RULES

NEVER re-explore a path already sufficiently covered in cache unless a real gap exists.
ALWAYS keep scope narrow.
ALWAYS separate planning from implementation.
ALWAYS update task state in cache.
USE exploration-cache/tasks/history/ for completed-pass memory.
ALWAYS update cache after discovering something new.
KEEP responses concise and point to cache files.
ASK before large explorations over 10 files.
Do not implement before returning the planning report and receiving approval.

## QUICK COMMANDS

[STATUS] Show current cache coverage for this objective
[GAPS] List missing info for current objective
[UPDATE] Force cache update with recent findings
[VERIFY] Check if answer exists in cache before exploring
[NEXT] Propose the next narrow pass

## TASK COMPLETION CHECKLIST

Before marking a pass complete:

- all listed deliverables exist
- content is grounded in cache or explicitly explored gaps
- no unrelated files were changed
- exploration-cache/tasks/current-task.md is updated
- create a brief summary-implementation.md with related implementation notes
- next step is clearly stated
- a summary file was created under `exploration-cache/tasks/summaries/`

## Summary Tracking Rule

For every planning, implementation, correction, or modification pass, create a short summary file in:

`exploration-cache/tasks/summaries/`

Use this naming format:

YYYY-MM-DD-<phase-name>-planning.md
YYYY-MM-DD-<phase-name>-implementation.md
YYYY-MM-DD-<phase-name>-modification.md
YYYY-MM-DD-<phase-name>-correction.md

## Each summary must include:

- Objective
- Cache files read
- Source files inspected
- Files changed, if any
- Key decisions
- Implementation details, if any
- Verification commands run
- Manual checks run or not run
- Known risks / TODOs
- Next step

## Also update:

- exploration-cache/tasks/current-task.md
- exploration-cache/tasks/history/ when the pass is completed

# CURRENT OBJECTIVE

# OMA-DOCS-UX-1 — Compact Documents tab with phase accordion

You are working inside the existing `AIDN_V2` repository.

## Context

The current DN dossier Documents tab works, but it displays documents as long vertical lists. This becomes too scroll-heavy, especially for Phase 2 — Demande formelle, which can contain many tracked documents.

We need a frontend-only UX optimization.

Current target screen:

- Admin app
- Dossier DN detail page
- `Documents` tab
- Existing download actions must keep working
- Existing document availability/status logic must not regress

Do not implement backend changes.
Do not change API routes.
Do not change upload/review/DG/meeting behavior.
Do not add new workflow rules.
Do not implement generic document versioning.
Do not change permissions.

---

## Objective

Refactor the Documents tab into a compact phase-based layout:

Documents du dossier
├── Résumé documentaire
├── Phase préliminaire
├── Phase 2 — Demande formelle
├── Phase 3 — Évaluation approfondie
├── Phase 4 — Démonstration / inspection
└── Phase 5 — Délivrance

Each phase should render as a compact accordion/card.

Default view should show phase summaries only.
Users can expand a phase to see document rows and download actions.

Design direction

Use the existing project UI conventions first.

Prefer:

existing shadcn-style components already present in the repo;
existing Card/Button/Badge/Separator/ScrollArea/Dialog/Sheet patterns;
clean institutional AIDN style;
compact spacing;
French labels.

You may use 21st.dev/shadcn inspiration for layout patterns, but do not blindly add a new dependency unless the project already uses it or the implementation clearly requires it.

If you need a new primitive, keep it local and simple.

Recommended visual style:

phase cards with soft borders;
compact badges;
clear counts;
no oversized cards;
no bento grid for the main document list;
optional drawer/sheet only if it stays simple.
Files to inspect first

Read cache first:

exploration-cache/manifest.json
exploration-cache/QUICK-REFERENCE.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/05-data/DATA_MODELS.md
exploration-cache/06-workflows/OMA_FORMAL_REQUEST_WORKFLOW.md
exploration-cache/tasks/current-task.md

Then inspect:

apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx
apps/admin/src/pages/DossierDetailPage.tsx
apps/admin/src/lib/api/dossiers.api.ts
apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx
apps/admin/src/pages/dossiers/preliminary-evidence.helpers.ts
apps/admin/src/pages/dossiers/formal-request-progress.helpers.ts
apps/admin/src/components/ui/\*

Also inspect any existing accordion/collapsible/sheet/dialog components before creating new ones.

Required UX

1. Top summary row

At the top of the Documents tab, add compact summary cards:

Documents suivis
Déposés
Manquants
Corrections

Use available data only.

If the current API does not provide correction counts, show only the counts that can be reliably derived.

Do not fake data.

Fallback labels:

- if unknown
  Non disponible if the section cannot be computed

2. Phase accordion cards

Render one compact card per phase:

Phase préliminaire
Phase 2 — Demande formelle
Phase 3 — Évaluation approfondie
Phase 4 — Démonstration / inspection
Phase 5 — Délivrance

Each collapsed phase card should show:

Phase title
Short phase status
Document count summary
Missing/correction summary if available
Last document activity date if available

Example:

Phase 2 — Demande formelle
Demande reçue · 10/14 pièces déposées
Bloquant : OK · Manquants : 2 · Corrections : 1
Dernier dépôt : 28 mai 2026

If a phase has no data yet:

Phase 3 — Évaluation approfondie
Non démarrée · Aucun document suivi pour le moment 3. Expanded phase content

When a phase is expanded, show compact rows:

Pièce Statut Visibilité Action
Formulaire DN-AIR-R2-3-F-E-010 Validé Visible postulant Télécharger
CV personnel d’encadrement Déposé Interne Télécharger
Programme de formation Manquant — —

Keep rows compact.

Do not use huge cards for every document.

For each row, show only:

Document label
Optional form/reference code
Status badge
Visibility badge if known
Last deposited date if known
Download action if file exists 4. Separate blocking documents from supporting documents

Inside expanded Phase 2, visually separate:

Documents de passage
Pièces de suivi

For Phase 2:

Documents de passage

- Lettre / courrier de demande formelle

Pièces de suivi

- Formulaire DN-AIR-R2-3-F-E-010
- Personnel d’encadrement
- CV
- Qualifications
- MPM
- Manuel SGS
- État de conformité
  ...

Important business rule to preserve in UI copy:

La demande formelle déclenche le circuit. Les pièces de suivi restent consultatives.

Keep the wording short and institutional.

5. Status badges

Use consistent French badge labels:

Disponible
Déposé
Validé
En revue
Correction demandée
Manquant
Optionnel
Conditionnel
Interne uniquement
Visible postulant

Do not introduce raw API status labels in the UI.

Create or reuse a helper like:

getDocumentStatusLabel(status)
getDocumentStatusBadgeVariant(status)

Keep it simple.

6. Search and filter, only if cheap

Add lightweight filters only if they do not bloat the task:

Recherche document
Toutes phases
Tous statuts

If this becomes too large, skip filters for this slice and document it as TODO.

Priority is phase accordion layout first.

7. Downloads must keep working

All existing download buttons must still call the same download handlers.

Do not change blob/open-in-new-tab behavior.

Reuse existing utility if available:

apps/admin/src/lib/utils/blob.ts
Suggested component split

Prefer local components inside the dossier documents area unless the repo already has a better shared location.

Suggested files:

apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx
apps/admin/src/pages/dossiers/components/PhaseDocumentAccordion.tsx
apps/admin/src/pages/dossiers/components/DocumentRequirementRow.tsx
apps/admin/src/pages/dossiers/components/DocumentStatusBadge.tsx

Only create these if they actually reduce complexity.

Do not over-componentize.

Data mapping requirements

Create a local view model from current AdminDossierDetail data.

Suggested view model:

type PhaseDocumentGroup = {
phaseKey: string;
title: string;
statusLabel: string;
summary: {
total?: number;
deposited?: number;
missing?: number;
corrections?: number;
lastActivityAt?: string;
};
blockingDocuments: DocumentRow[];
supportingDocuments: DocumentRow[];
};

type DocumentRow = {
id: string;
label: string;
formCode?: string;
status: string;
visibility?: string;
depositedAt?: string;
fileName?: string;
canDownload: boolean;
downloadHandler?: () => void;
};

Use the real current API fields. Adapt names to the existing code.

Do not force this exact type if the current data shape suggests a cleaner version.

Phase behavior
Phase préliminaire

Must preserve existing documents:

Compte rendu - 1ère réunion
Formulaire pré-évaluation - modèle
Formulaire pré-évaluation - soumis
Retour DG annoté
Compte rendu - réunion préliminaire
Courrier de clôture phase I
Phase 2 — Demande formelle

Must display:

formal request / courrier gate if available;
supporting checklist documents if already available from current API;
missing supporting documents if current API exposes them.

If some Phase 2 data is not available yet, show graceful empty states.

Phases 3–5

For now, show compact empty/non-started cards if no data exists.

Do not invent document lists unless already available from current data/API.

Empty states

Use French labels:

Aucun document déposé pour cette phase.
Aucune pièce suivie pour le moment.
Cette phase n’est pas encore démarrée.
UI copy

Use French UI wording.

Recommended labels:

Documents du dossier
Résumé documentaire
Documents de passage
Pièces de suivi
Voir les documents
Masquer les documents
Dernière activité
Aucun fichier
Télécharger
Non disponible
Non démarrée
Accessibility / interaction
Accordion headers should be clickable.
Keyboard interaction should work if using accessible shadcn primitives.
Do not hide download buttons behind hover-only UI.
Keep text readable on small laptop screens.
Constraints

Do not:

change backend;
change API contracts;
add mutations;
add uploads;
add review actions;
change phase gating logic;
remove existing document download support;
introduce mock data as real data;
show technical IDs;
expose raw enum labels.
Verification

Run:

cd apps/admin
npx tsc --noEmit
npm run build

Manual checks:

1. Documents tab loads.
2. Page is shorter by default.
3. Phase cards render.
4. Phase préliminaire documents are still visible when expanded.
5. Phase 2 documents/checklist render when data exists.
6. Phases 3–5 show clean empty/non-started states.
7. Download buttons still work.
8. Missing documents do not show download buttons.
9. French labels are clean.
10. No backend calls were added except existing document downloads.
    Documentation updates

Update:

TASK.md
exploration-cache/tasks/current-task.md
exploration-cache/03-frontend/ADMIN_APP_MAP.md
exploration-cache/QUICK-REFERENCE.md
exploration-cache/manifest.json

Create summary:

exploration-cache/tasks/summaries/2026-05-28-oma-docs-ux-1-documents-phase-accordion.md

Document:

Documents tab now uses compact phase accordion.
Default view shows phase summaries.
Expanded view shows compact document rows.
Phase 2 separates blocking document from supporting checklist.
No backend/API behavior changed.
Expected implementation report

Return:

Files created
Files modified
Components added/reused
Layout behavior
Phase grouping behavior
Status badge mapping
Download behavior
Verification commands run
Manual checks completed
Risks/TODOs

```

```

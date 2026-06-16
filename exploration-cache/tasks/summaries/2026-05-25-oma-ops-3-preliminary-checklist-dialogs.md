# OMA-OPS-3 - Phase préliminaire checklist + action dialogs

Date: 2026-05-25
Status: **Complete - typecheck PASS, build PASS**

---

## Objective

Replace the monolithic inline action panel in `PreliminaryPhaseWorkspace.tsx`
(5 inline forms + 300-line if/else) with a checklist-based workspace. No
backend changes.

---

## Cache Files Read

- `exploration-cache/tasks/current-task.md`
- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`
- `exploration-cache/manifest.json`

---

## Source Files Inspected

- `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx` - 849 lines, 5 inline forms
- `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`
- `apps/admin/src/pages/dossiers/dossier-detail.helpers.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/components/ui/split-view.tsx`
- `apps/admin/src/components/ui/dialog.tsx` (confirmed Radix UI Dialog)
- `apps/admin/src/lib/utils.ts` (confirmed `cn` available)

---

## Files Changed

| File                                                          | Change                              |
| ------------------------------------------------------------- | ----------------------------------- |
| `apps/admin/src/components/ui/split-view.tsx`                 | Fixed Tailwind CSS production issue |
| `apps/admin/src/pages/dossiers/PreliminaryPhaseWorkspace.tsx` | Full rewrite                        |
| `apps/admin/src/pages/dossiers/DossierPhasesTab.tsx`          | Section title update only           |

## Files Created

| File                                                          | Purpose                     |
| ------------------------------------------------------------- | --------------------------- |
| `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`       | 7 dialog components bundled |
| `apps/admin/src/pages/dossiers/PreliminaryPhaseChecklist.tsx` | 11-step checklist           |

---

## Key Decisions

1. **Dialogs bundled in one file** (`preliminary-dialogs.tsx`) - avoids 7
   separate files for tightly related, small components. Documented.

2. **Each dialog manages its own loading/error state** - simpler than shared
   parent state from original; dialogs call API directly and invoke `onSuccess`
   on completion.

3. **`InviteMeetingDialog` and `RecordMeetingDialog` use `onConfirm` callback**
   - reused for two contexts each (first meeting vs preliminary meeting). The
     workspace passes the correct API call.

4. **Evidence block** - only `preEvaluationDgAnnotatedDocumentId` has a working
   download button (existing `downloadDossierDocument` API + `canConsultPreEvalDgReturn`
   permission). All other documents show "Téléchargement à activer dans OMA-OPS-4".

5. **Export kept as `PreliminaryActionPanel`** - avoids touching `DossierPhasesTab.tsx`
   import. The internal refactor is transparent.

6. **SplitView fix** - Changed from `lg:grid-cols-${columns}` (not statically
   scannable by Tailwind) to `lg:grid-cols-[var(--split-cols)]` (literal class
   present in source) + `style={{ '--split-cols': cols }}`. Added
   `parseColumns()` to strip Tailwind arbitrary value brackets/underscores so
   the CSS variable gets valid CSS (e.g., `2fr 3fr` not `[2fr_3fr]`).
   Existing callers (`DgCircuitPage`, `RequestsPage`) need no changes.

---

## Checklist Model (11 steps)

```
1. Dossier ouvert après orientation DG              [always done]
2. Première réunion de contact planifiée            [done: firstMeetingId]
3. Compte rendu première réunion joint              [done: firstMeetingReportDocumentId]
4. Formulaire pré-évaluation mis à disposition      [done: preEvaluationTemplateDocumentId]
5. Formulaire pré-évaluation complété reçu          [done: completedPreEvaluationDocumentId]
6. Pré-évaluation mise en circuit DG                [done: status ∈ sent/returned/decided/...]
7. Retour DG pré-évaluation enregistré              [done: preEvaluationDgAnnotatedDocumentId]
8. Réunion préliminaire planifiée                   [done: preliminaryMeetingId]
9. Compte rendu réunion préliminaire joint          [done: preliminaryMeetingReportDocumentId]
10. Courrier de clôture phase I téléversé           [done: closureCourrierDocumentId]
11. Phase préliminaire clôturée                     [done: status = preliminary_closed]
```

---

## Dialog → API mapping

| Dialog                       | API call                   |
| ---------------------------- | -------------------------- |
| InviteMeetingDialog (first)  | `inviteFirstMeeting`       |
| RecordMeetingDialog (first)  | `recordFirstMeeting`       |
| PublishPreEvalDialog         | `publishPreEvaluationForm` |
| SendToDgDialog               | `sendPreEvalToDg`          |
| RecordDgReturnDialog         | `recordPreEvalDgReturn`    |
| InviteMeetingDialog (prelim) | `invitePreliminaryMeeting` |
| RecordMeetingDialog (prelim) | `recordPreliminaryMeeting` |
| UploadClosureCourrierDialog  | `uploadClosureCourrier`    |
| ClosePreliminaryDialog       | `closePreliminaryPhase`    |

---

## Verification

- Admin typecheck: **PASS** (no output)
- Admin build: **PASS** (1,439.14 kB / 415.40 kB gzip)
- Manual checks: pending runtime browser validation

---

## Known Risks / TODOs

- **Browser validation needed**: checklist rendering for each status, each
  dialog opening/closing, API calls still fire correctly, permission gating.
- **OMA-OPS-4**: document download for all evidence documents.
- **`pre_eval_dg_returned` status**: present in the `PreliminaryStatus` type
  but not covered by current backend routes. Handled defensively (same action
  as `pre_eval_sent_to_dg` → RecordDgReturnDialog).

---

## Next Step

OMA-OPS-4: Document download endpoints + Documents tab implementation.

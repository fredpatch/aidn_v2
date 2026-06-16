# OMA-OPS-9C - Frontend Primitive Refactor Before Phase 2

Date: 2026-05-26
Status: **Complete - Admin typecheck PASS, Admin build PASS**

---

## Objective

Extract small reusable frontend primitives before implementing Phase 2. Frontend-only refactor; no backend, no API contract changes, no Phase 2 behavior.

---

## Files Created

| File                                                                | Purpose                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/admin/src/lib/utils/blob.ts`                                  | `openBlobInNewTab` utility with popup-block fallback        |
| `apps/admin/src/lib/utils/error.ts`                                 | `extractError` utility supporting ApiError + generic shapes |
| `apps/admin/src/pages/dossiers/components/UploadDocumentDialog.tsx` | Generic controlled file+date+notes upload dialog            |

---

## Files Modified

| File                                                            | Change                                                                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/admin/src/pages/dossiers/DossierCourriersTab.tsx`         | Removed local `openBlobInNewTab`, import from `@/lib/utils/blob`                                                                        |
| `apps/admin/src/pages/dossiers/DossierHistoriqueTab.tsx`        | Removed local `openBlobInNewTab`, import from `@/lib/utils/blob`                                                                        |
| `apps/admin/src/pages/dossiers/DossierDocumentsTab.tsx`         | Removed local `openBlobInNewTab`, import from `@/lib/utils/blob`                                                                        |
| `apps/admin/src/pages/dossiers/DossierMeetingsTab.tsx`          | Removed local `openBlobInNewTab`, import from `@/lib/utils/blob`                                                                        |
| `apps/admin/src/pages/dossiers/preliminary-dialogs.tsx`         | Removed local `extractError`; refactored `RecordDgReturnDialog` and `UploadClosureCourrierDialog` to use generic `UploadDocumentDialog` |
| `apps/admin/src/pages/dossiers/preliminary-evidence.helpers.ts` | Extended `EvidenceRequirement` with `submittedDocumentId?` and `reviewStatus?: EvidenceReviewStatus`                                    |

---

## Part 1 - Blob Utility

`blob.ts` implements the popup-safe pattern used in all 4 dossier tab files:

- Opens `about:blank` first (avoids immediate popup blocker)
- Detects blocked popups via `null` return, alerts user, revokes URL
- Sets `document.title` to fileName
- Auto-revokes ObjectURL after 60s

`DgCircuitPage.tsx` and `PreliminaryPhaseWorkspace.tsx` use a pre-opened window variant (`openBlobPreview` / inline) - left unchanged since they open the window before the async call to avoid blockers in a different way.

---

## Part 2 - Error Utility

`error.ts` implements `extractError(error, fallback)`:

- `ApiError` → `error.message`
- `Error` → `error.message`
- `response.data.error.message` or `response.data.message` for Axios-style errors
- Default fallback: `"Une erreur est survenue. Réessayez."` (matches original behavior)

`DgCircuitPage.tsx` has a local `formatApiError` with 401-specific text - left unchanged.

---

## Part 3 - UploadDocumentDialog

Generic props: `title`, `description?`, `fileLabel?`, `dateLabel?`, `notesLabel?`, `submitLabel?`, `requireDate?`, `requireNotes?`, `onSubmit({ file, date?, notes? })`.

- Date field rendered only when `dateLabel` is provided
- Notes field rendered only when `notesLabel` is provided
- Reset on close and after successful submit
- Error state managed internally; `onSubmit` errors are caught and displayed

`RecordDgReturnDialog` → wraps generic with `dateLabel="Date de retour (optionnel)"`, `notesLabel="Notes (optionnel)"`, maps `date → returnedAt` in FormData.

`UploadClosureCourrierDialog` → wraps generic with `notesLabel="Intitulé (optionnel)"` (no date), maps `notes → title` in FormData.

External API (props) of both dialogs unchanged - no consumer changes needed.

---

## Part 4 - EvidenceRequirement Type

Added `EvidenceReviewStatus` union type:

```ts
type EvidenceReviewStatus =
  | "missing"
  | "available"
  | "under_review"
  | "validated"
  | "rejected"
  | "requires_correction"
  | "optional";
```

Added to `EvidenceRequirement`:

- `submittedDocumentId?: string`
- `reviewStatus?: EvidenceReviewStatus`

No PRELIMINARY_EVIDENCE_REQUIREMENTS values changed. No Phase 2 requirements added.

---

## Verification

```
cd apps/admin
npx tsc --noEmit  → PASS (no output)
npm run build     → PASS (3945 modules, 1.23s)
```

---

## Manual Checks Required

1. Documents tab downloads still open (uses `openBlobInNewTab` from blob.ts)
2. Meetings tab report downloads still open
3. Courriers tab downloads still open
4. Preliminary workspace document downloads still open (inline - untouched)
5. DG circuit returned document download still opens (local openBlobPreview - untouched)
6. Record DG return dialog opens, validates file, submits
7. Upload closure courrier dialog opens, validates file, submits
8. Existing error messages still appear (PublishPreEvalDialog, SendToDgDialog, etc.)
9. Preliminary evidence checklist still renders
10. No Phase 2 UI appears

---

## Known Limitations

- `DgCircuitPage.tsx` uses a local `openBlobPreview(blob, fileName, previewWindow?)` that takes a pre-opened window - not merged into blob.ts since the calling pattern is different (window opened before async call).
- `PreliminaryPhaseWorkspace.tsx` uses the same pre-opened window pattern inline - also left unchanged.
- `RequestsPage.tsx` uses the same inline pattern - left unchanged (doesn't call a named helper).

---

## Next Step

OMA-OPS-10 / Phase 2 - Demande formelle

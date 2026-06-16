# OMA-EVAL-6D — Portal Phase 3 Action Block

Date: 2026-06-01
Type: implementation (portal frontend)
Status: Complete — portal tsc 0 errors

---

## Objective

Implement the postulant-facing Phase 3 block inside the portal Dossier tab of `RequestDetailPage.tsx`.
Invoice download, payment proof upload, evaluation list, correction upload.

---

## Cache files read

- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-6a-portal-phase-3-api-readiness-audit.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-6b-portal-phase-3-backend-read-download.md`
- `exploration-cache/tasks/summaries/2026-06-01-oma-eval-6c-portal-phase-3-api-client-types.md`
- `exploration-cache/03-frontend/PORTAL_APP_MAP.md`

---

## Source files inspected

- `apps/portal/src/pages/RequestDetailPage.tsx` — Dossier tab structure, `handleDownload` pattern, upload form pattern, CSS classes, error handling
- `apps/portal/src/lib/api/portal.api.ts` — confirmed types/methods from 6C

---

## Files changed

**New:**
- `apps/portal/src/components/Phase3DocumentEvaluationBlock.tsx` — self-loading Phase 3 component

**Modified:**
- `apps/portal/src/pages/RequestDetailPage.tsx` — import + Phase 3 block insertion in Dossier tab

---

## Key decisions

1. **Self-loading component** — `Phase3DocumentEvaluationBlock` receives `dossierId` and manages its own state (`state`, `loading`, `loadError`). No new state in `RequestDetailPage`.
2. **404 silent hide** — if backend returns 404 (phase not opened), component returns `null` — no error shown, Phase 2 content unaffected.
3. **Extracted to separate file** — `RequestDetailPage.tsx` was already ~1535 lines; extracted to `components/Phase3DocumentEvaluationBlock.tsx`.
4. **`CorrectionUploadForm` sub-component** — each correction card is independent with its own file ref, notes, busy, error state.
5. **Download pattern** — matches existing `handleDownload`: `blob → URL.createObjectURL → <a> click → revokeObjectURL`. Download errors use `toast.error`.
6. **Upload pattern** — matches existing portal form pattern: `field`/`control` CSS, label, file input, optional textarea, `btn btn-primary`.
7. **Proof upload re-upload** — backend allows re-upload when `canUploadPaymentProof = true` (even if proof already submitted). UI shows download + no upload form when proof exists (conservative — avoids accidental overwrite).
8. **Phase 3 block placed after Phase 2 meeting blocks** — before the download error banner and the dossier footer.

---

## Block layout

```
Phase3DocumentEvaluationBlock
├── Loading state (while fetching)
├── Load error (non-404 errors)
├── null (if phase not opened / 404)
└── Content
    ├── Header: "Phase III — Évaluation approfondie" + phase status badge
    ├── Section 1 — Facture: download button or "En attente de la facture ANAC"
    ├── Section 2 — Paiement: proof upload form or "Preuve envoyée" + download
    ├── Section 3 — Évaluation: evaluation list (status chips) or waiting message
    ├── Section 4 — Corrections: CorrectionUploadForm per canUploadCorrection item
    ├── Correction submitted notice (when corrections sent, none pending)
    └── Actualiser button
```

---

## Status badge colors

| Status | Color |
|---|---|
| closed | emerald |
| waiting_corrections | amber |
| others | sky |

---

## Verification

```
npx tsc --noEmit (portal) → 0 errors
```

Build not run (tsc covers this slice; no Tailwind/Vite changes).

---

## Manual checks

Not run — dev server not available. Checklist deferred.

---

## Known risks / TODOs

- `loading` variable inside `Phase3DocumentEvaluationBlock` is used in the Refresh button disabled check, but `loading` state only reads true on the initial/reload fetch (not set true by upload handlers) — acceptable; the block self-reloads after uploads and the refresh button will be briefly active during upload
- If `dossierId` changes while component is mounted (rare), `useCallback` dep on `dossierId` causes reload — correct behavior
- Sonner `toast` must be imported/rendered somewhere in the portal app tree — confirmed from `RequestDetailPage.tsx` which already uses it

---

## Next step

**OMA-EVAL-7** — Cross-tab polish (DossierDocumentsTab Phase 3 section, Historique events, Dashboard priority actions) — deferred.

Phase 3 full feature set is now complete:
- OMA-EVAL-1: Backend payment gate ✅
- OMA-EVAL-2: Backend document evaluation ✅
- OMA-EVAL-3: Backend correction upload ✅
- OMA-EVAL-4: Backend Phase 3 close + unlock Phase 4 ✅
- OMA-EVAL-5A/5B: Admin Phase 3 workspace ✅
- OMA-EVAL-5A-1: Backend Phase 3 document download fix ✅
- OMA-EVAL-S5-1/2/3: Internal S5 Facturation workspace ✅
- OMA-EVAL-6A/6B/6C/6D: Portal Phase 3 block ✅

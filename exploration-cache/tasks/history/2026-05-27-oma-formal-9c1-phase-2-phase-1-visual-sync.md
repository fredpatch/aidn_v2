# OMA-FORMAL-9C1 - Phase 2 Phase 1 Visual Sync

Date: 2026-05-27
Status: Complete

## Summary

Phase 2 - Demande formelle was reshaped to feel closer to the Phase préliminaire guided workspace.

## Changes

- One main Phase 2 workspace card now contains metadata, formal courrier details, meeting details, compact document summary, and guided next action.
- Full-card `Courrier formel`, `Réunion formelle`, and `Documents de demande formelle` sections were replaced by lighter internal sections.
- Meeting and document sections sit side by side on wide screens.
- `Démarrée le` now falls back to formal request reception date when `phaseRecord.startedAt` is missing.

## Verification

- Admin `npx tsc --noEmit`: PASS.
- Admin `npm run build`: PASS after outside-sandbox rerun for known Vite/Tailwind native Windows binary issue.

## Remaining

- Live browser visual comparison with Phase préliminaire.

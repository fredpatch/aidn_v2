# OMA-FORMAL-9B1B - Admin Phase 2 Physical DG Circuit Actions

Date: 2026-05-27
Status: Complete

## Summary

Admin Phase 2 formal request actions were adjusted to make portal upload the normal path and admin courrier registration an outside-portal fallback only.

## Implementation

- Updated `FormalRequestPhaseWorkspace.tsx`:
  - missing gate message now waits for postulant portal deposit;
  - fallback button is `Scanner / enregistrer un courrier reçu hors portail`;
  - `portal_upload` displays as `Téléversé par le postulant`;
  - physical DG/parapheur helper appears for `Mettre en circuit DG`;
  - DG return scan and DG decision are separate actions.
- Updated `formal-request-dialogs.tsx`:
  - fallback courrier dialog renamed and documented;
  - `SendFormalToDgDialog` helper aligned with physical circuit wording;
  - `RecordFormalDgReturnDialog` now only records the scanned DG return;
  - new `RecordFormalDgDecisionDialog` records the decision separately.

## Verification

- Admin `npx tsc --noEmit`: PASS.
- Admin `npm run build`: PASS after outside-sandbox rerun for the known Vite/Tailwind native Windows binary issue.

## Remaining

- Live browser/API validation against a real Phase 2 dossier.

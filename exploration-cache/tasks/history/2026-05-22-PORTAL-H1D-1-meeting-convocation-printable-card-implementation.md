# PORTAL-H1D-1 Meeting Convocation Printable Card Implementation

Implemented a frontend-only printable meeting convocation card:

- `Voir la convocation` and `Imprimer` actions on upcoming meeting cards.
- `Voir la convocation` and `Imprimer` actions on selected-day calendar meeting items.
- Modal convocation card using existing `PortalMeeting` data plus current portal user full name.
- Browser print with print CSS that reveals only `.print-area`.
- No backend changes, no PDF generation, no document registry, no new dependencies.

Verification passed:

- Portal `npm run typecheck`
- Portal `npm run lint`
- Portal `npm run build` after known outside-sandbox Tailwind/Vite native binary rerun

Manual browser print-preview validation remains pending.

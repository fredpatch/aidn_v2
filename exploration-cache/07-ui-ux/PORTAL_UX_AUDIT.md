# Portal UX Audit

Last reviewed: 2026-05-05

## Scope audited
- /portal-preview
- /portal-preview/dossiers/:id

## Current strengths
- Home screen is focused (status/action/update + one path to detail).
- Detail content grouped by tabs matching user intent.
- External wording mostly simplified.
- Explicit read-only positioning.

## Risks
- Portal is still inside protected admin auth flow (not true external access).
- Some labels still reflect internal phrasing in supporting data descriptions.

## Historical problem captured
- Previous long concatenated portal view was overloaded.
- The split to Home + Detail tabs should be treated as a UX baseline constraint.

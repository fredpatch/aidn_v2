# Roles And Permissions

Last reviewed: 2026-05-05

## Implemented in code (technical)
- Auth model is simplified: authenticated vs not authenticated.
- Login sets local token and user name "Agent DN".
- All app pages (including portal preview) are under ProtectedRoute.

## Domain roles represented in data/labels
- Postulant / organisme (external actor)
- DG (direction generale touchpoint)
- DN (main operator role in prototype)
- EC, S5/compta, R3 (touchpoints represented in evidence/actions labels)
- Reception/assistant DN (mentioned in docs and notes; not modeled as separate auth role)

## Permission reality
- No role-based authorization matrix implemented.
- No separate auth realm for external postulant in current prototype.
- "Portal preview" is a simulation inside the protected admin shell.

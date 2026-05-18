# Internal Auth Flow Decision

Last reviewed: 2026-05-18

## Decision
AIDN treats the official ANAC personnel database as the identity and legitimacy source, but AIDN owns application credentials.

## Flow
1. Admin searches official personnel through the selected personnel adapter.
2. Admin activates an internal AIDN account for the selected personnel.
3. AIDN creates or updates the local `User` and `AidnInternalAccount`.
4. AIDN generates a temporary password, stores only its bcrypt hash, and returns the temporary value once for local/dev.
5. The account starts as `pending_first_login` and the user has `mustChangePassword=true`.
6. Login confirms the matricule still exists in official personnel, finds the local AIDN account, uses `AidnInternalAccount.status` for application activity, rejects disabled accounts, and checks the local password hash.
7. Password change verifies the current local password, requires at least 8 new characters, clears `mustChangePassword`, and activates the account.

## Frontend Wiring
- Admin UI now supports bootstrap login and internal ANAC login in API mode while preserving mock mode.
- First-login password change is handled at `/changer-mot-de-passe`.
- Personnel search, account activation, internal account listing, and audit logs are available under `/admin/*`.
- Personnel and internal-account tables intentionally hide email; matricule is the operational login identifier.
- Personnel and audit logs are paginated from the backend with `{ items, page, limit, total }`.
- Audit logs enrich `actorId` to `actor.fullName`/`matricule`/`role` when the user exists.

## Non-Goals
- Do not copy official DB passwords.
- Do not validate login passwords against the official DB.
- Do not implement account-request approval, dossier/courrier/DG workflow, phase preliminaire, or frontend changes in this phase.

## Risks And TODOs
- Production temporary password delivery needs a secure channel.
- `employee_directory` has no active-status field. The official personnel DB only confirms existence. AIDN account activity is determined by `AidnInternalAccount.status`.
- Temporary password expiry is stored but not yet enforced during login.
- Account lockout and stronger password policy are future hardening tasks.

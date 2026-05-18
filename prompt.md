# AIDN API-1C Correction — Personnel Active Status Boundary

API-1C was implemented, but one business rule needs correction.

Current wrong assumption:

- `employee_directory` has no active-status field, so personnel are assumed active.

Correct rule:

- The official ANAC personnel DB is only the identity/legitimacy source.
- It proves that a matricule/personnel exists.
- It does not decide whether the user is active in AIDN.
- AIDN account activity is controlled only by `AidnInternalAccount.status`.

Update implementation and docs accordingly.

## Required changes

1. In `maria-personnel.adapter.ts`, do not return `isActive: true` by default.
   - Omit `isActive` if the official DB does not expose it.
   - Keep `personnelId = matricule`.

2. In activation logic, only reject personnel when:
   ```ts
   personnel.isActive === false;
   ```

Do not reject when isActive is undefined.

In login logic:
continue checking that matricule exists in official personnel DB;
continue using AIDN DB to decide account status:
pending_first_login
active
disabled
do not use official DB active status unless it exists later.
Update docs:
TASK.md
AUTH_AND_ACCESS.md
AUTH_AND_PERMISSIONS.md
DATA_MODELS.md
personnel-mariadb-adapter.md
internal-auth-flow.md

Replace any wording saying personnel are “assumed active” with:

employee_directory has no active-status field. The official personnel DB only confirms existence. AIDN account activity is determined by AidnInternalAccount.status.
Verification

Run:

cd apps/api
npm run typecheck
npm run lint
npm run build

Then verify:

personnel search still works;
activation still works;
login still checks official DB existence;
disabled AIDN internal account cannot login;
pending_first_login still requires password change;
active AIDN account can login normally.

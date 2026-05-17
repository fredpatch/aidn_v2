# AUTH_AND_ACCESS.md

Last reviewed: 2026-05-17
Source files inspected: apps/api/src/modules/auth, apps/api/src/modules/admin, apps/api/src/modules/personnel, apps/api/src/shared/guards, apps/api/src/shared/permissions

## Confirmed facts
- Bootstrap admin is only for initial setup and emergency access.
- Internal users are personnel-backed and cannot self-register in AIDN.
- Internal login validates `matricule + password` through the personnel adapter, then checks AIDN activation.
- Disabled internal accounts and inactive local users are rejected.
- Internal account activation only accepts internal roles: `admin`, `dn_supervisor`, `dn_agent`, `dg_secretariat`, `reception`, `bureau_courrier`.
- `postulant` cannot be assigned through internal personnel activation.
- Login and activation paths write audit logs without passwords.

## Source files to inspect first
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/admin/admin.service.ts`
- `apps/api/src/modules/personnel/personnel.types.ts`
- `apps/api/src/modules/personnel/mock-personnel.adapter.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/shared/permissions/permissions.ts`

## Known gaps
- Real MySQL/SIGEM personnel adapter is pending.
- Password policy and account lockout are pending for bootstrap admin.
- Token revocation/session storage is not implemented yet.
- Phase preliminaire implementation is still pending and must not start in API-1.

## Next update
- Define production personnel adapter contract and operational security rules with ANAC IT.

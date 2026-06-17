# Personnel Source Adapters

Last reviewed: 2026-06-16

## Behavior
- Personnel access is routed through `PersonnelAdapter`.
- `PERSONNEL_SOURCE=api|maria|mock` selects the runtime source.
- `ApiPersonnelAdapter` consumes the external read-only SI-ANAC Personnel API.
- `MariaPersonnelAdapter` reads the local MariaDB `employee_directory` view through TypeORM.
- `searchPersonnel(search)` searches matricule, first name, last name, direction, and fonction, ordered by matricule and capped at 50 rows.
- `getPersonnelById(personnelId)` and `getPersonnelByMatricule(matricule)` both resolve by matricule because `personnelId = matricule` for now.
- The adapter never validates passwords against the official DB.

## Identity Mapping
- `personnelId`: normalized matricule, preserved for existing AIDN account compatibility.
- `matricule`: normalized matricule; numeric values preserve leading zeros, for example `161 -> 0161`.
- External API/database id: currently not persisted as AIDN `personnelId`; plan a migration before changing this.
- `fullName`: `firstName lastName`
- `email`: derived by `derivePersonnelEmail`
- `direction`: official direction label
- `fonction`: official fonction label
- `isActive`: omitted because `employee_directory` has no active-status field
- Account activity: determined by `AidnInternalAccount.status`, not the official personnel DB

## Email Derivation
- Trims names, lowercases, removes accents, strips unsupported characters, collapses internal spaces to `-`, and joins available name parts with `.`.
- Example: `Fred` + `Patchelli` becomes `fred.patchelli@anac-gabon.com`.
- If both names are missing, no email is returned.

## Runtime Configuration
- `PERSONNEL_SOURCE=api` selects the external SI-ANAC Personnel API.
- `PERSONNEL_SOURCE=maria` selects the MariaDB fallback/local adapter.
- `PERSONNEL_SOURCE=mock` selects mock data.
- Backward compatibility: when `PERSONNEL_SOURCE` is omitted, `OFFICIAL_PERSONNEL_DB_ENABLED=true` maps to `maria`; otherwise `MOCK_PERSONNEL_ENABLED !== false` maps to `mock`.
- API mode requires `PERSONNEL_API_BASE_URL` and `PERSONNEL_API_KEY`; header is `x-api-key`.
- MariaDB initializes only when `PERSONNEL_SOURCE=maria`; startup fails in Maria mode without host, user, and database name.

## Active Status Boundary
- `employee_directory` has no active-status field.
- The official personnel DB only confirms existence.
- AIDN account activity is determined by `AidnInternalAccount.status`.

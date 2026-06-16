# Personnel MariaDB Adapter

Last reviewed: 2026-05-18

## Behavior
- `MariaPersonnelAdapter` reads the local MariaDB `employee_directory` view through TypeORM.
- `searchPersonnel(search)` searches matricule, first name, last name, direction, and fonction, ordered by matricule and capped at 50 rows.
- `getPersonnelById(personnelId)` and `getPersonnelByMatricule(matricule)` both resolve by matricule because `personnelId = matricule` for now.
- The adapter never validates passwords against the official DB.

## Identity Mapping
- `personnelId`: `matricule`
- `matricule`: `matricule`
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
- `OFFICIAL_PERSONNEL_DB_ENABLED=true` selects this adapter.
- `MOCK_PERSONNEL_ENABLED=true` selects the mock only when official mode is not enabled.
- Startup fails if official mode is enabled without the required MariaDB host, user, and database name.

## Active Status Boundary
- `employee_directory` has no active-status field.
- The official personnel DB only confirms existence.
- AIDN account activity is determined by `AidnInternalAccount.status`.

# AIDN API-1 Prompt — Auth + Internal Account Activation

You are working inside the existing `AIDN_V2` repository.

The backend foundation has already been initialized under `apps/api`.

Do not restart the backend architecture. Continue from the current modular monolith.

---

## Current state

Implemented backend routes already include:

- `GET /health`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/bootstrap/login`
- `POST /api/v1/auth/internal/login`
- `GET /api/v1/admin/personnel?search=`
- `GET /api/v1/admin/internal-accounts`
- `POST /api/v1/admin/internal-accounts/activate`
- `GET /api/v1/admin/organizations`
- `GET /api/v1/admin/account-requests`

The backend is a modular monolith using:

- Node.js
- TypeScript
- Express
- MongoDB
- Mongoose
- JWT/session scaffolding
- Modular service/repository/controller structure

---

## Task objective

Implement and harden the **Auth + internal account activation flow**.

This phase must focus only on:

1. Bootstrap admin login
2. Current user session endpoint
3. Official personnel lookup through adapter
4. Internal AIDN account activation
5. Internal login through personnel adapter
6. Role/capability enforcement
7. Audit logging for auth/admin account actions

Do **not** implement request workflow, courrier workflow, DG review workflow, dossier opening, OMA phases, portal requests, uploads, emails, or certificate generation.

---

## Business rules

Internal ANAC users must not self-register inside AIDN.

Internal users come from the official personnel database / SIGEM-like source.

AIDN only stores:

- local user mirror;
- activation status;
- AIDN role;
- permissions;
- audit references;
- login timestamps.

Internal login flow:

```txt
matricule + password
→ validate against official personnel adapter
→ check AIDN internal account activation
→ load local AIDN user
→ load role/capabilities
→ issue JWT

Important constraints:

Do not store internal staff passwords locally.
Do not allow inactive/disabled internal accounts to login.
Do not create internal users directly from arbitrary input.
Do not activate an account without matching official personnel data.
Bootstrap admin is only for first setup and emergency admin access.
Capability checks must be used for admin actions.
Roles to support

Ensure these roles exist consistently:

bootstrap_admin
admin
dn_supervisor
dn_agent
dg_secretariat
reception
bureau_courrier
postulant

For this phase, activation should allow assigning internal roles only:

admin
dn_supervisor
dn_agent
dg_secretariat
reception
bureau_courrier

Do not allow activating an internal personnel account as postulant.

Permissions needed in this phase

Make sure these permissions work with middleware/guards:

PERSONNEL_SEARCH
AIDN_USER_ACTIVATE
AIDN_USER_ASSIGN_ROLE
AUDIT_VIEW

Bootstrap admin and admin should have these permissions.

Other roles can be mapped but should not receive admin activation permissions unless already intended.

Required behavior
1. Bootstrap login

Review and harden:

POST /api/v1/auth/bootstrap/login

Expected input:

{
  email: string;
  password: string;
}

Expected behavior:

validates credentials against seeded bootstrap admin;
rejects inactive users;
returns JWT and current user payload;
updates lastLoginAt;
writes audit log for successful and failed login attempts if audit module is available.

Expected response shape:

{
  token: string;
  user: {
    id: string;
    userType: "internal" | "postulant";
    fullName: string;
    email?: string;
    matricule?: string;
    role: string;
    permissions: string[];
  }
}
2. Current user

Review and harden:

GET /api/v1/auth/me

Expected behavior:

requires valid JWT;
loads fresh user from DB;
rejects inactive users;
returns user identity and permissions;
does not expose passwordHash.
3. Personnel search

Review and harden:

GET /api/v1/admin/personnel?search=

Expected behavior:

requires authentication;
requires PERSONNEL_SEARCH;
queries personnel adapter;
supports search by matricule, name, email if mock adapter supports it;
returns personnel records without password or sensitive auth fields.

Suggested response shape:

{
  items: [
    {
      personnelId: string;
      matricule: string;
      fullName: string;
      email?: string;
      phone?: string;
      service?: string;
      direction?: string;
      isActive?: boolean;
      alreadyActivated: boolean;
      aidnUserId?: string;
      aidnRole?: string;
      activationStatus?: "active" | "disabled";
    }
  ]
}
4. Internal accounts list

Review and harden:

GET /api/v1/admin/internal-accounts

Expected behavior:

requires authentication;
requires AIDN_USER_ACTIVATE or admin-level capability;
returns activated internal accounts;
supports optional filters if simple to add:
search
role
status

Suggested response shape:

{
  items: [
    {
      id: string;
      personnelId: string;
      matricule: string;
      userId: string;
      fullName: string;
      email?: string;
      role: string;
      status: "active" | "disabled";
      activatedAt?: string;
      activatedById?: string;
      lastLoginAt?: string;
    }
  ]
}
5. Activate internal account

Review and harden:

POST /api/v1/admin/internal-accounts/activate

Expected input:

{
  personnelId: string;
  role: "admin" | "dn_supervisor" | "dn_agent" | "dg_secretariat" | "reception" | "bureau_courrier";
}

Expected behavior:

requires authentication;
requires AIDN_USER_ACTIVATE;
validates personnel exists in official personnel adapter;
rejects inactive personnel if adapter exposes isActive === false;
creates or updates local User mirror;
creates or updates AidnInternalAccount;
sets status to active;
links account to local userId;
preserves external source fields;
does not create passwordHash for internal user;
records activatedById;
creates audit log.

Important:

If user/account already exists, update role/status safely instead of duplicating.
Enforce unique account per personnelId / matricule.
Do not allow postulant role here.

Suggested response:

{
  account: {
    id: string;
    personnelId: string;
    matricule: string;
    userId: string;
    fullName: string;
    email?: string;
    role: string;
    status: "active";
  }
}
6. Internal login

Review and harden:

POST /api/v1/auth/internal/login

Expected input:

{
  matricule: string;
  password: string;
}

Expected behavior:

validates credentials through personnel adapter;
does not validate password locally;
finds matching active AidnInternalAccount;
loads linked local AIDN user;
rejects if no active AIDN activation exists;
rejects if local user is inactive;
updates lastLoginAt on both user and internal account;
returns JWT and user payload with permissions;
writes audit log for success/failure.

Expected failure cases:

invalid personnel credentials;
personnel exists but not activated in AIDN;
internal account disabled;
local user inactive;
missing linked local user.
Personnel adapter

Review current adapter interface and mock implementation.

Ensure the interface supports at least:

type PersonnelIdentity = {
  personnelId: string;
  matricule: string;
  fullName: string;
  email?: string;
  phone?: string;
  service?: string;
  direction?: string;
  isActive?: boolean;
};

interface PersonnelAdapter {
  searchPersonnel(search: string): Promise<PersonnelIdentity[]>;
  getPersonnelById(personnelId: string): Promise<PersonnelIdentity | null>;
  authenticateByMatricule(
    matricule: string,
    password: string
  ): Promise<PersonnelIdentity | null>;
}

Mock adapter may use static users for now.

Do not implement real MySQL/SIGEM connection yet. Add a TODO note for the real adapter.

Audit logging

If audit module/model exists, emit audit logs for:

auth.bootstrap_login_success
auth.bootstrap_login_failed
auth.internal_login_success
auth.internal_login_failed
admin.internal_account_activated
admin.internal_account_role_changed
admin.internal_account_reactivated

Audit metadata should avoid storing passwords.

Security requirements
Never return passwordHash.
Never log passwords.
Validate request bodies.
Normalize matricule where appropriate.
Use safe error messages.
Keep detailed technical errors out of API responses.
JWT payload should contain minimal identity data:
userId
role
userType
Permissions should be computed server-side, not trusted from token.
Frontend is out of scope

Do not wire the admin frontend to the API in this phase.

You may document expected frontend contract, but do not implement frontend screens.

Out of scope

Do not implement:

account request approval/rejection;
portal account creation;
postulant login;
request/courrier submission;
DG workflow;
dossier creation;
phase transitions;
document upload;
email sending;
QLOG integration;
certificate generation;
reports.
Expected deliverables

After implementation, provide a report with:

Files created.
Files modified.
Endpoints reviewed/updated.
Auth flow summary.
Internal activation flow summary.
Personnel adapter behavior.
Permission/capability changes.
Audit events added.
Verification commands run.
Assumptions/TODOs.
Verification commands

Run from the appropriate workspace/package locations:

npm run typecheck
npm run lint
npm run build

If API-specific commands exist, also run:

cd apps/api
npm run typecheck
npm run lint
npm run build
Update tracking

Update TASK.md.

Also update or create exploration-cache notes under:

exploration-cache/04-backend/
exploration-cache/05-data/
exploration-cache/10-decisions/

Add a short note documenting:

internal users are personnel-backed;
AIDN only activates internal personnel accounts;
internal passwords are never stored locally;
bootstrap admin is only for initial setup/emergency access;
Phase préliminaire implementation is still pending and must not be started in this task.
```

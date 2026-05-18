# AIDN UI-AUTH-1 Prompt — Wire Admin Auth + Internal Account Activation UI

You are working inside the existing `AIDN_V2` repository.

API-INIT, API-1, and API-1C are completed and tested with Postman/cURL.

The backend auth/personnel/account activation flow is ready.

Do not implement Phase préliminaire.
Do not implement account request approval.
Do not implement request/courrier/DG/dossier workflow.
Do not implement file upload.
Do not implement postulant portal authentication yet.

This task is only to wire the admin frontend to the implemented backend auth and internal account activation endpoints.

---

## Backend endpoints available

Use:

```http
POST /api/v1/auth/bootstrap/login
POST /api/v1/auth/internal/login
POST /api/v1/auth/internal/change-password
GET  /api/v1/auth/me

GET  /api/v1/admin/personnel?search=
GET  /api/v1/admin/internal-accounts
POST /api/v1/admin/internal-accounts/activate
GET  /api/v1/admin/audit-logs

Use the existing frontend API base URL env:

VITE_API_BASE_URL=http://localhost:4000
Current frontend state

The admin frontend is still mock/demo-oriented.

There is already:

apps/admin/src/lib/api/client.ts
apps/admin/src/lib/data/data-mode.ts
existing auth context / login page if present
mock/demo token behavior

Inspect existing structure before coding.

Preserve mock mode behavior.

Only call the real API when data mode or env says API mode is enabled.

Objective

Implement the real UI flow for:

Bootstrap admin login.
Internal ANAC login by matricule/password.
Auth session loading with /auth/me.
First-login password change.
Personnel search from real official personnel DB through API.
Internal account activation.
Internal account listing.
Optional read-only audit logs page if route already exists or can be added simply.
Required behavior
1. API client

Ensure the frontend API client:

uses VITE_API_BASE_URL;
attaches Authorization: Bearer <token>;
handles JSON errors safely;
does not leak token in logs.

If an API helper already exists, extend it instead of replacing it.

2. Auth context/session

Update the frontend auth layer to support real API mode.

Expected state:

type AuthUser = {
  id: string;
  userType: "internal" | "postulant";
  fullName: string;
  email?: string;
  matricule?: string;
  role: string;
  permissions: string[];
  mustChangePassword?: boolean;
};

Token storage:

use existing token storage convention if present;
do not create competing token keys.

Required auth functions:

loginBootstrap(email, password)
loginInternal(matricule, password)
loadCurrentUser()
changePassword(currentPassword, newPassword)
logout()

On app startup:

if token exists → GET /api/v1/auth/me
if invalid → clear token and redirect login
3. Login page

Update or create the admin login page.

UI must be in French.

Provide two modes/tabs:

Administrateur initial
Agent ANAC

Bootstrap mode:

Email
Mot de passe

Internal mode:

Matricule
Mot de passe

On internal login response:

If requiresPasswordChange === true:

store token
redirect to /changer-mot-de-passe

Else:

redirect to dashboard/admin home

Do not expose raw backend error details.

Use French messages:

Connexion impossible.
Identifiants invalides ou compte non activé.
4. First-login password change

Create route/page if missing:

/changer-mot-de-passe

Fields:

Mot de passe actuel
Nouveau mot de passe
Confirmer le nouveau mot de passe

Rules:

new password length >= 8;
confirmation must match;
call POST /api/v1/auth/internal/change-password;
on success, refresh /auth/me;
redirect to dashboard.

French helper text:

Votre compte AIDN nécessite un changement de mot de passe avant de continuer.
5. Personnel search page

Create or update:

/admin/personnel

or use the existing admin route convention.

UI:

title: Personnel ANAC
search input placeholder:
Rechercher par matricule, nom, direction ou fonction
button: Rechercher

Call:

GET /api/v1/admin/personnel?search=<term>

Show columns:

Matricule
Nom complet
Email
Direction
Fonction
Statut AIDN
Action

Activation status:

Non activé
Activé
Désactivé
Première connexion en attente

If already activated, show role/status and disable activation button unless update role is already supported.

6. Activation dialog

When clicking Activer le compte:

Fields:

Personnel
Matricule
Email
Rôle AIDN

Allowed roles:

admin
dn_supervisor
dn_agent
dg_secretariat
reception
bureau_courrier

French labels:

admin: "Administrateur"
dn_supervisor: "Superviseur DN"
dn_agent: "Agent DN"
dg_secretariat: "Secrétariat DG"
reception: "Réception"
bureau_courrier: "Bureau courrier"

Submit:

POST /api/v1/admin/internal-accounts/activate

Payload:

{
  "personnelId": "<matricule>",
  "role": "dn_agent"
}

On success, show the temporary password once:

Compte activé

Le mot de passe temporaire ci-dessous ne sera affiché qu’une seule fois.
Copiez-le et transmettez-le à l’agent par un canal sécurisé.

Matricule: XXXX
Mot de passe temporaire: XXXXXXXX

Buttons:

Copier le mot de passe
J’ai copié

Do not store temporary password after modal closes.

Refresh personnel search/list after activation.

7. Internal accounts page

Create or update:

/admin/internal-accounts

Call:

GET /api/v1/admin/internal-accounts

Support filters if API already supports them:

search
role
status

Columns:

Nom complet
Matricule
Email
Rôle
Statut
Activé le
Dernière connexion

Status labels:

pending_first_login: "Première connexion en attente"
active: "Actif"
disabled: "Désactivé"
8. Audit logs page

If simple, add or update read-only page:

/admin/audit-logs

Call:

GET /api/v1/admin/audit-logs

Show:

Date
Acteur
Action
Entité
Statut

This is optional if the app already has no admin audit route yet. Do not overbuild.

Data mode guard

Preserve mock/demo mode.

When mock mode is enabled:

existing demo behavior should continue;
real API calls should not run unless API mode is active.

When API mode is enabled:

auth/personnel/internal accounts should use real API.

Do not convert all AIDN mock screens to API mode yet.

Security/UI constraints
Do not log JWT.
Do not store temporary password.
Do not show password in tables.
Do not expose backend stack traces.
Do not allow activation as postulant.
Do not add frontend-only permission bypasses.
Route guards should use permissions from /auth/me.
Suggested route guards

Admin personnel page requires one of:

PERSONNEL_SEARCH
AIDN_USER_ACTIVATE

Internal accounts page requires:

AIDN_USER_ACTIVATE

Audit logs page requires:

AUDIT_VIEW

If the frontend route guard does not yet support permissions, add a minimal helper:

hasPermission(user, permission)

Do not overbuild a full ACL framework.

Expected deliverables

Return an implementation report with:

Files created.
Files modified.
Routes added/updated.
Auth UI behavior.
Password-change behavior.
Personnel search behavior.
Activation behavior.
Internal accounts behavior.
Data mode behavior.
Commands run.
Known limitations/TODOs.
Verification

Run from frontend app:

cd apps/admin
npm run typecheck
npm run lint
npm run build

If scripts differ, inspect package.json and run the equivalent.

Runtime manual checks:

Start API.
Start admin frontend with:
VITE_API_BASE_URL=http://localhost:4000
Login as bootstrap admin.
Search a real personnel record.
Activate the account.
Copy temporary password.
Logout.
Login as activated personnel.
Confirm redirect to password change.
Change password.
Confirm normal login works.
Confirm internal account appears in list.
Confirm no temporary password remains visible after closing modal.
```

# Acceptance Checklist

```txt
✅ Bootstrap login works from UI
✅ Internal login works from UI
✅ First login redirects to password change
✅ Password change activates account
✅ /auth/me restores session after refresh
✅ Personnel search uses backend API
✅ Account activation creates pending_first_login account
✅ Temporary password shown once only
✅ Internal accounts list loads from API
✅ Mock mode still works
✅ No Phase préliminaire UI was touched
✅ Build passes
```

# AIDN API-2 Prompt — Postulant Account Request + Validation + Canonical Organization

You are working inside the existing `AIDN_V2` repository.

Current validated state:

- API-INIT completed.
- API-1 completed.
- API-1C completed.
- Admin UI auth/internal account activation works end-to-end.
- Internal users are activated from the official ANAC personnel DB.
- AIDN owns its app credentials for internal users.
- Internal auth flow has been validated through UI:
  - search personnel from official DB;
  - activate account;
  - temporary password first login;
  - password change;
  - normal login.

Now implement API-2.

Do not implement frontend UI in this task.
Do not implement Phase préliminaire.
Do not implement request/courrier submission.
Do not implement DG workflow.
Do not implement dossier opening.
Do not implement file upload.
Do not implement email sending.
Do not implement QLOG integration.

---

## Objective

Implement backend API for:

1. External postulant account request submission.
2. Admin/DN review of account requests.
3. Approval by linking to existing canonical organization or creating a new canonical organization.
4. Creation of postulant user account.
5. Organization membership creation.
6. Rejection with reason.
7. Audit logging.

This is the foundation required before external postulants can submit demandes.

---

## Business rules

AIDN distinguishes:

````txt
Raw requested organization name
Canonical organization
Postulant user
Organization membership

The raw organization name submitted by the postulant must not be used directly for statistics or dossier ownership.

On approval, admin must either:

link the request to an existing canonical organization; or
create a new canonical organization.

Future demandes/dossiers must use organizationId, not raw organization name.

A postulant account request must not automatically create an active account without review.

Existing models to inspect first

Inspect and reuse existing models if already created:

apps/api/src/modules/account-requests/
apps/api/src/modules/organizations/
apps/api/src/modules/users/
apps/api/src/modules/audit/

Likely models/collections:

account_requests
postulant_organizations
organization_members
users
audit_logs

Do not duplicate models if they already exist.

Required endpoint group
Public / portal-facing API

Add:

POST /api/v1/portal/account-requests

This endpoint is public for now.

Expected payload:

{
  requestedOrganizationName: string;
  requestedLegalAddress?: string;
  requestedEmail?: string;
  requestedPhone?: string;
  approvalNumberOrigin?: string;

  contactFullName: string;
  contactEmail: string;
  contactPhone?: string;

  password: string;
}

Expected behavior:

validates required fields;
normalizes email;
hashes password;
creates AccountRequest with status submitted;
does not create User yet;
does not create Organization yet;
does not create OrganizationMember yet;
does not auto-login;
returns sanitized request data.

Suggested response:

{
  request: {
    id: string;
    requestedOrganizationName: string;
    contactFullName: string;
    contactEmail: string;
    status: "submitted";
    createdAt: string;
  }
}

Password must never be returned.

Admin API

Update or implement:

GET /api/v1/admin/account-requests
GET /api/v1/admin/account-requests/:id
POST /api/v1/admin/account-requests/:id/approve
POST /api/v1/admin/account-requests/:id/reject

All admin routes require auth.

Recommended permission:

POSTULANT_ACCOUNT_REVIEW

Admin and bootstrap_admin should have this permission.

GET /api/v1/admin/account-requests

Supports filters:

status
search
from
to

Search should match:

requestedOrganizationName
contactFullName
contactEmail
requestedEmail

Suggested response:

{
  items: [
    {
      id: string;
      requestedOrganizationName: string;
      requestedLegalAddress?: string;
      requestedEmail?: string;
      requestedPhone?: string;
      approvalNumberOrigin?: string;

      contactFullName: string;
      contactEmail: string;
      contactPhone?: string;

      status: "submitted" | "under_review" | "approved" | "rejected";

      matchedOrganizationId?: string;
      createdOrganizationId?: string;
      resultingUserId?: string;

      reviewedById?: string;
      reviewedAt?: string;
      rejectionReason?: string;

      createdAt: string;
      updatedAt: string;
    }
  ]
}

Never return passwordHash.

GET /api/v1/admin/account-requests/:id

Returns full sanitized request details.

Never return passwordHash.

POST /api/v1/admin/account-requests/:id/approve

Expected payload:

type ApproveAccountRequestPayload =
  | {
      organizationMode: "existing";
      organizationId: string;
      memberRole?: "primary_contact" | "representative" | "viewer";
    }
  | {
      organizationMode: "create";
      organization: {
        canonicalName: string;
        legalAddress?: string;
        email?: string;
        phone?: string;
        approvalNumberOrigin?: string;
        aliases?: string[];
      };
      memberRole?: "primary_contact" | "representative" | "viewer";
    };

Default member role:

primary_contact

Expected behavior:

requires POSTULANT_ACCOUNT_REVIEW;
rejects if request is already approved/rejected;
if organizationMode=existing, validates organization exists and is active;
if organizationMode=create, creates canonical organization;
creates local User with:
userType = "postulant"
fullName = contactFullName
email = contactEmail
phone = contactPhone
role = "postulant"
organizationId = resolved organization id
passwordHash = accountRequest.passwordHash
isActive = true
creates OrganizationMember:
organizationId
userId
memberRole
status = "active"
approvedById
approvedAt
updates AccountRequest:
status = "approved"
matchedOrganizationId or createdOrganizationId
resultingUserId
reviewedById
reviewedAt
writes audit event;
operation should be atomic via Mongo transaction if the current DB connection supports it.

Suggested response:

{
  request: {...sanitized},
  user: {
    id: string;
    fullName: string;
    email: string;
    role: "postulant";
    organizationId: string;
  },
  organization: {
    id: string;
    canonicalName: string;
  },
  membership: {
    id: string;
    memberRole: string;
    status: "active";
  }
}
POST /api/v1/admin/account-requests/:id/reject

Expected payload:

{
  reason: string;
}

Expected behavior:

requires POSTULANT_ACCOUNT_REVIEW;
reason is required;
rejects if already approved/rejected;
updates AccountRequest:
status = "rejected"
rejectionReason
reviewedById
reviewedAt
does not create User;
does not create Organization;
writes audit event.

Suggested response:

{
  request: {
    id: string;
    status: "rejected";
    rejectionReason: string;
    reviewedAt: string;
  }
}
Organizations API support

Existing:

GET /api/v1/admin/organizations

Ensure it supports:

search
status

Suggested response:

{
  items: [
    {
      id: string;
      canonicalName: string;
      normalizedName: string;
      aliases: string[];
      legalAddress?: string;
      email?: string;
      phone?: string;
      approvalNumberOrigin?: string;
      status: "active" | "suspended" | "archived";
      createdAt: string;
      updatedAt: string;
    }
  ]
}

If organization create is only needed inside account approval, do not expose standalone create endpoint yet unless it already exists.

Normalization rules

Add helper if missing:

normalizeOrganizationName(name)

Behavior:

trim;
lowercase;
collapse spaces;
remove accents if simple;
use for normalizedName.

When creating organization:

reject duplicate normalizedName if active organization already exists;
allow aliases to include raw submitted name;
ensure aliases are unique normalized values if implemented.
Security requirements
Never return passwordHash.
Never log password.
Public account request endpoint should have basic validation.
Do not auto-approve account requests.
Do not auto-create organization on submission.
Do not expose internal audit metadata publicly.
Admin approval/rejection must use authenticated actor id.
Reject invalid organization mode.
Reject postulant creation through internal account activation; this remains separate.
Audit events

Add:

portal.account_request_submitted
admin.account_request_approved
admin.account_request_rejected
admin.organization_created_from_account_request
admin.organization_linked_from_account_request

Metadata should not include password or passwordHash.

Optional but useful

If there is no public route group yet, add:

apps/api/src/modules/portal/

or add route registration under the account-requests module.

Keep it simple.

Documentation updates

Update:

TASK.md
exploration-cache/04-backend/API_ROUTES.md
exploration-cache/05-data/DATA_MODELS.md
exploration-cache/04-backend/AUTH_AND_PERMISSIONS.md
exploration-cache/10-decisions/

Create/update decision note:

exploration-cache/10-decisions/postulant-account-organization-linking.md

Document:

raw organization names are not reporting entities;
approval links/creates canonical organization;
User is created only after approval;
passwordHash is transferred from AccountRequest to resulting postulant user;
account request approval is separate from initial demande/courrier workflow;
dedicated postulant frontend will come later.
Verification commands

Run:

cd apps/api
npm run typecheck
npm run lint
npm run build

If runtime checks are possible, run API and test with curl/Postman.

Expected implementation report

Return:

Files created.
Files modified.
Routes added/updated.
Account request lifecycle implemented.
Organization linking behavior.
User/membership creation behavior.
Audit events.
Security checks.
Verification commands run.
Runtime tests run or not run.
Risks/TODOs.

# Review checklist before accepting API-2

```txt
✅ Public account request submission works
✅ Request stores raw organization data only
✅ No user is created before approval
✅ No organization is created before approval
✅ Admin can list requests
✅ Admin can approve with existing organization
✅ Admin can approve by creating organization
✅ Organization normalizedName prevents obvious duplicates
✅ User role is postulant
✅ OrganizationMember is created
✅ Request becomes approved
✅ Admin can reject with reason
✅ PasswordHash never returned
✅ Audit logs created
✅ Build passes
````

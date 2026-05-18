# Postulant Account Organization Linking

Last reviewed: 2026-05-18

## Decision
- Raw organization names submitted by postulants are stored on `account_requests` for review only.
- Raw submitted names are not reporting entities and must not be used for dossier ownership.
- An account request does not create a user, organization, organization membership, demande, courrier, dossier, upload, email, or QLOG event at submission time.
- Approval must resolve the request to a canonical `postulant_organizations` record by either linking an existing active organization or creating a new one.
- New organizations created during approval use `normalizeOrganizationName` for `normalizedName`; active duplicates are rejected.
- When creating a canonical organization from a request, the raw submitted organization name is stored as a normalized alias.
- Only after approval does AIDN create the postulant `User` and `OrganizationMember`.
- The approved user receives `userType=postulant`, `role=postulant`, `organizationId`, and the `passwordHash` originally stored on the request.
- Rejection records a required reason and does not create downstream identity or organization records.

## Boundary
- This is an account onboarding foundation only.
- Phase preliminaire, demande/courrier submission, DG workflow, dossier opening, upload, email sending, and QLOG integration remain out of scope.
- A dedicated postulant frontend can be added later against the public and authenticated portal APIs.

## Audit
- `portal.account_request_submitted`
- `admin.account_request_approved`
- `admin.account_request_rejected`
- `admin.organization_created_from_account_request`
- `admin.organization_linked_from_account_request`

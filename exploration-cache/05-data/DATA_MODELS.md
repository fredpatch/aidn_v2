# Data Models

Last reviewed: 2026-05-18
Source: apps/admin/src/features/aidn/types/aidn.types.ts

## Core AIDN entities
- AidnDemande
- AidnCourrier
- AidnDgDecisionRecord
- AidnDossier
- AidnOmaPhase
- AidnDocument
- AidnPhaseEvidenceItem
- AidnPhaseNextAction
- AidnMeeting
- AidnCertificate
- AidnTimelineEvent
- AidnDashboardSummary

## Enums source
- apps/admin/src/features/aidn/types/aidn.enums.ts

## State container model
- AidnDemoState in apps/admin/src/features/aidn/storage/aidn-demo-storage.ts
  - demandes, courriers, dossiers, omaPhases, documents, meetings, certificates, phaseEvidenceItems, phaseNextActions, updatedAt

## Backend Mongoose collections initialized
- `users`
- `aidn_internal_accounts`
- `postulant_organizations`
- `organization_members`
- `account_requests`
- `requests`
- `courriers`
- `dg_reviews`
- `dossiers`
- `oma_phases`
- `documents`
- `document_templates`
- `meetings`
- `notifications`
- `audit_logs`

## Backend data constraints
- Reports and dossiers must use `organizationId`, not raw account request organization names.
- `dossiers` store both `organizationId` and `postulantUserId`.
- `requests` represent demande/courrier intake before a DN dossier exists.
- `dg_reviews` is reusable across initial request, phase, closure, and certificate review targets.
- Internal users are personnel-backed: `users.externalSource`, `users.externalUserId`, `users.matricule`, and `aidn_internal_accounts.personnelId` link local access to official personnel identity.
- For now `personnelId` is the official `matricule`.
- `users.passwordHash` stores only the AIDN internal application password hash, never an official DB password.
- Internal credential flags live on `users`: `mustChangePassword`, `temporaryPasswordExpiresAt`, and `passwordChangedAt`.
- Internal activation state lives on `aidn_internal_accounts.status`: `pending_first_login`, `active`, or `disabled`.
- `employee_directory` exposes `matricule`, `firstName`, `lastName`, `direction`, and `fonction`; email is derived as `firstname.lastname@anac-gabon.com`, phone is omitted, and no active-status field is exposed.
- The official personnel DB only confirms existence. AIDN account activity is determined by `AidnInternalAccount.status`.
- API-1 audit events are stored in `audit_logs`; auth failure logs may not have an entity id.

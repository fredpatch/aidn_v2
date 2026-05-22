# Data Models

Last reviewed: 2026-05-21
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
- API-2 account requests keep raw organization fields on `account_requests` only until review; raw names are not reporting entities.
- `account_requests` now includes `approvalNumberOrigin`, contact identity, `passwordHash`, lifecycle status, review metadata, and links to matched/created organization and resulting user.
- Public account request submission creates only an `account_requests` document. No `users`, `postulant_organizations`, or `organization_members` records are created before approval.
- Approval transfers the stored request `passwordHash` to the resulting `users.passwordHash` for a `userType=postulant`, `role=postulant` account.
- Approval also creates an `organization_members` record with member role `primary_contact`, `representative`, or `viewer`; default is `primary_contact`.
- Canonical organizations use `normalizedName = trim + lowercase + collapsed spaces + simple accent removal`; active duplicate normalized names are rejected when creating from approval.
- `dossiers` store both `organizationId` and `postulantUserId`.
- `requests` represent demande/courrier intake before a DN dossier exists. PORTAL-3 creates and submits `Request` records only; a DN dossier is opened later only after DG orientation toward DN.
- `requests` now include `submittedById`, `organizationId`, request type, subject/message, status, `courrierSource`, `initialCourrierId`, `initialDocumentId`, physical deposit metadata, and submission/closure timestamps.
- Portal draft requests remain draft-side until the final `submit` call; old separate courrier/deposit endpoints may remain for compatibility but are not the normal visible business workflow.
- Physical deposit metadata separates postulant planning from admin receipt: postulant stores `expectedDepositDate`, location, notes, and `status=planned`; admin/reception later stores `physicalDepositDate`, `status=received`, official reference, and scan document.
- `requests.status` now includes internal intake statuses `intake_in_review` and `intake_requires_correction` before `initial_sent_to_dg`.
- `requests.status` may still include legacy `reoriented` for database compatibility, but reorientation is deferred out of the MVP UI/workflow and is not presented as a normal current path.
- `requests.intake` stores internal-only intake metadata: started date/actor, correction request date/actor/reason, printed-for-DG date/actor, sent-to-DG date/actor, and notes.
- For the MVP DG circuit, `printedForDgAt` and `sentToDgAt` can be stamped by the same print action because printing starts the physical DG review path.
- `requests.initialDgReviewId` can point to the initial request DG review created/updated when printing and later completed when the DG return is recorded.
- Visible OMA request type labels are corrected while the stable enum values remain `oma_recognition`, `oma_approval`, `oma_renewal`, and `oma_modification`.
- `courriers` can reference either an uploaded initial courrier document or a physical deposit declaration. For physical deposits, `documentId` is optional until a scan exists.
- Internal physical courrier registration updates initial `courriers` with `source=internal_scan`, optional official reference, required actual physical deposit date, scan date, document id, registering actor, and notes.
- Uploaded initial courrier creates a `documents` record with `ownerType=request`, `category=courrier`, `documentType=initial_courrier`, `visibility=internal_only`, and `status=uploaded`.
- Admin physical receipt scans create a `documents` record with `ownerType=request`, `category=courrier`, `documentType=initial_courrier_scan`, `visibility=internal_only`, and `status=uploaded`.
- All uploaded files must be registered in the `documents` collection; AIDN must not keep uploads only as raw storage paths on business records.
- DG return scans are mandatory for DG decision recording and create a `documents` record with `ownerType=request`, `category=courrier`, `documentType=dg_annotated_courrier`, `title=Retour DG annoté`, `visibility=internal_only`, and `status=uploaded`.
- `dg_reviews` is reusable across initial request, phase, closure, and certificate review targets.
- `oma_phases.preEvaluationDgAnnotatedDocumentId` links the scanned DG-annotated return for the pre-evaluation form. DN continuation after pre-evaluation DG annotation depends on this linked proof, not only the status label.
- Initial request DG return recording stores decision metadata in `dg_reviews`, links `returnedScannedDocumentId` to the registered document, and persists `cancelled_by_dg` input as the existing `rejected` decision/status path for compatibility.
- DN verification start requires both the request status and proof document: `requests.status=oriented_to_dn`, the linked initial `dg_reviews.decision=oriented_to_dn`, and `dg_reviews.returnedScannedDocumentId` present. Status alone is not sufficient.
- Rejected/cancelled DG decisions remain terminal for DN verification and dossier opening.
- Documents is the future GED surface. OCR and search indexing are deferred.
- Internal users are personnel-backed: `users.externalSource`, `users.externalUserId`, `users.matricule`, and `aidn_internal_accounts.personnelId` link local access to official personnel identity.
- For now `personnelId` is the official `matricule`.
- `users.passwordHash` stores only the AIDN internal application password hash, never an official DB password.
- Internal credential flags live on `users`: `mustChangePassword`, `temporaryPasswordExpiresAt`, and `passwordChangedAt`.
- Internal activation state lives on `aidn_internal_accounts.status`: `pending_first_login`, `active`, or `disabled`.
- `employee_directory` exposes `matricule`, `firstName`, `lastName`, `direction`, and `fonction`; email is derived as `firstname.lastname@anac-gabon.com`, phone is omitted, and no active-status field is exposed.
- The official personnel DB only confirms existence. AIDN account activity is determined by `AidnInternalAccount.status`.
- API-1 audit events are stored in `audit_logs`; auth failure logs may not have an entity id.
- API-2 audit events include public account request submission, admin approval/rejection, and organization creation/linking from account request review.

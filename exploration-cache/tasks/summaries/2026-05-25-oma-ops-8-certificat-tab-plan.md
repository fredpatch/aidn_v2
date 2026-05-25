# OMA-OPS-8 - Certificat Tab Planning

Date: 2026-05-25
Status: Planning complete - no implementation

## Objective

Plan the Certificat tab and semi-digital certificate delivery workflow for the end of the full OMA process. No code implementation in this pass.

## Cache files read

- `prompt.md`
- `exploration-cache/manifest.json`
- `exploration-cache/QUICK-REFERENCE.md`
- `exploration-cache/tasks/current-task.md`
- OMA-OPS summaries 1 through 7B:
  - `2026-05-25-oma-ops-1-dossier-operations-ux-plan.md`
  - `2026-05-25-oma-ops-2-dossier-cockpit-tabs.md`
  - `2026-05-25-oma-ops-3-preliminary-checklist-dialogs.md`
  - `2026-05-25-oma-ops-3d-closure-without-upload.md`
  - `2026-05-25-oma-ops-4-documents-tab-downloads.md`
  - `2026-05-25-oma-ops-5-reunions-tab.md`
  - `2026-05-25-oma-ops-6-courriers-tab.md`
  - `2026-05-25-oma-ops-7-historique-tab-plan.md`
  - `2026-05-25-oma-ops-7-historique-tab-implementation.md`
  - `2026-05-25-oma-ops-7b-compact-historique-implementation.md`
- `exploration-cache/06-workflows/CERTIFICATE_WORKFLOW.md`

## Source files inspected

- `docs/AIDN_OMA_WORKFLOW_SOURCE_NOTES.md`
- `apps/admin/src/pages/dossiers/DossierCertificatTab.tsx`
- `apps/admin/src/pages/CertificatsPage.tsx`
- `apps/admin/src/lib/api/dossiers.api.ts`
- `apps/admin/src/lib/api/document-templates.api.ts`
- `apps/admin/src/features/aidn/types/aidn.enums.ts`
- `apps/admin/src/features/aidn/types/aidn.types.ts`
- `apps/api/src/modules/documents/document.model.ts`
- `apps/api/src/modules/document-templates/document-template.model.ts`
- `apps/api/src/modules/document-templates/document-template.service.ts`
- `apps/api/src/modules/meetings/meeting.model.ts`
- `apps/api/src/modules/meetings/meeting.service.ts`
- `apps/api/src/modules/dg-reviews/dg-review.model.ts`
- `apps/api/src/modules/oma-phases/oma-phase.model.ts`
- `apps/api/src/modules/dossiers/dossier.model.ts`
- `apps/api/src/modules/admin/admin.routes.ts`
- `apps/api/src/shared/permissions/permissions.ts`

## Files changed

- `exploration-cache/tasks/summaries/2026-05-25-oma-ops-8-certificat-tab-plan.md`
- `exploration-cache/tasks/current-task.md`
- `exploration-cache/manifest.json`

## Existing certificate capabilities

- No backend `certificates` module exists under `apps/api/src/modules`.
- No certificate API helper exists in `apps/admin/src/lib/api`.
- `DossierCertificatTab.tsx` is a placeholder only.
- `CertificatsPage.tsx` exists, but it is a mock/demo surface backed by `apps/admin/src/features/aidn` local demo state, not the real API.
- Mock statuses are: `to_prepare`, `printed`, `signed_stamped`, `scanned_in_aidn`, `ready_for_collection`, `collected`, `archived`.
- Mock certificate fields include certificate number/type, prepared/printed/signed/stamped/scanned/ready/collected/archive dates, holder, linked document, scanned document, preparedBy, signedBy, collectedBy, and collection note.
- `exploration-cache/06-workflows/CERTIFICATE_WORKFLOW.md` already records the gap: no real certificate generation, signature, stamp, or delivery workflow service.

## Existing template/document capabilities

- `DocumentTemplateModel` exists and supports:
  - `code`
  - `title`
  - `phaseKey` including `delivery`
  - `documentType` including `certificate_template`
  - `fileDocumentId`
  - `isActive`
  - `createdById`
- `createDocumentTemplate` and `listDocumentTemplates` exist behind `/api/v1/admin/document-templates`, guarded by `DOCUMENT_UPLOAD_INTERNAL`.
- Current `getActivePreEvalTemplate` is pre-evaluation-specific. There is no generic `getActiveTemplate(documentType, phaseKey)` helper yet.
- `DocumentModel` already supports:
  - `ownerType: "certificate"`
  - `category: "certificate"` and `category: "template"`
  - `documentType: "certificate_template"`
- `DocumentModel.documentType` does not yet include generated certificate, DG signed certificate scan, or final DG+postulant signed scan types.
- `downloadAdminDossierDocument` currently serves only approved preliminary evidence document fields. Certificate document downloads will need their own allowed-link validation.

## Existing meeting reuse possibilities

- `MeetingModel` requires `dossierId` and `phaseId`, which fits delivery-phase withdrawal meetings.
- Statuses already fit: `planned`, `invited`, `held`, `postponed`, `cancelled`.
- `outlookEmailStatus` supports manual tracking: `not_required`, `to_be_sent_manually`, `sent_manually`.
- The current enum lacks a specific `certificate_withdrawal_meeting` value. It has `other`, but adding a specific value is better for reporting and portal labels.
- `listPortalMeetings` already exposes meetings to postulants by dossier ownership. If withdrawal meetings use `MeetingModel`, they can be visible in the portal calendar once created.
- Admin meeting mutation endpoints currently exist only for preliminary meetings. Certificate withdrawal needs new delivery-specific endpoints or generic dossier/phase meeting endpoints.

## Backend gaps

- No `CertificateModel`.
- No `CertificateService`.
- No admin routes for certificate read/generate/status/upload/meeting/close actions.
- No certificate fields in `AdminDossierDetail`.
- No certificate document download endpoint/allowlist.
- No certificate status transition guard.
- No delivery-phase business guard that blocks certificate generation until prior phases are complete.
- No final-scan-required guard before delivery closure.
- No certificate-specific permissions.
- No generation engine from templates. Template storage exists, but no merge/render/PDF generation exists.
- No certificate number generation or uniqueness rule.
- No official field schema for certificate-specific data.
- No lifecycle event/audit integration for certificate actions.

## Recommended data model

Create `CertificateModel` with one active certificate per dossier for MVP:

```ts
type CertificateStatus =
  | "not_started"
  | "template_ready"
  | "draft_generated"
  | "printed_for_signature"
  | "sent_to_dg_signature"
  | "signed_by_dg"
  | "collection_meeting_planned"
  | "collected_signed_by_postulant"
  | "scanned_archived"
  | "delivery_phase_closed";
```

Recommended fields:

- `dossierId`, `requestId`, `phaseId`
- `organizationId`, `postulantUserId`
- `certificateType` derived initially from dossier type
- `status`
- `certificateNumber`
- `deliveryDate`
- `expirationDate`
- `templateId`, `templateDocumentId`
- `generatedDocumentId`
- `dgSignedScanDocumentId`
- `finalSignedScanDocumentId`
- `collectionMeetingId`
- lifecycle dates: `generatedAt`, `printedAt`, `sentToDgAt`, `dgSignedAt`, `collectionPlannedAt`, `collectedAt`, `finalScanArchivedAt`, `closedAt`
- actor fields: `generatedById`, `printedById`, `sentToDgById`, `dgSignedRecordedById`, `collectedById`, `finalScanUploadedById`, `closedById`
- `collectedByName`, `collectionNotes`
- `metadata` for certificate-specific fields not yet standardized

Document model additions:

- Add document types:
  - `certificate_generated`
  - `certificate_dg_signed_scan`
  - `certificate_final_signed_scan`
- Store generated/scanned certificate documents with `ownerType: "certificate"` and `ownerId: certificate._id`.

DG signature modeling:

- For MVP, store simple certificate status fields and scans on `CertificateModel`.
- Later, optionally create `DGReview` with `targetType: "certificate_document"` for formal DG circuit tracking, since the enum already supports that target type.

## Recommended lifecycle and labels

Use the prompt-provided lifecycle as the real target, not the older mock statuses:

| Status | French label |
| --- | --- |
| `not_started` | Non demarre |
| `template_ready` | Modele disponible |
| `draft_generated` | Certificat genere |
| `printed_for_signature` | Imprime pour signature |
| `sent_to_dg_signature` | Envoye a la signature DG |
| `signed_by_dg` | Signe/cachete par DG |
| `collection_meeting_planned` | Rendez-vous retrait planifie |
| `collected_signed_by_postulant` | Signe et retire par le postulant |
| `scanned_archived` | Scanne et archive dans AIDN |
| `delivery_phase_closed` | Phase delivrance cloturee |

Guard rules:

- Only applies to `delivery` phase.
- Do not generate before required prior phases are complete and delivery phase is active.
- Do not close delivery before final signed scan is uploaded.
- No digital signature in MVP.
- Physical DG signature/cachet and postulant signature/retrait remain official.

## Recommended Certificat tab UX

Replace the placeholder with an operational structure once backend data exists:

1. `Statut actuel`
   - lifecycle badge, next required action, delivery-phase guard message.
2. `Informations certificat`
   - organisme, postulant, type certificat, numero certificat, date delivrance, date expiration, dossier lie, phase liee.
3. `Modele utilise`
   - active certificate template title/code and download/consult action.
4. `Certificat genere`
   - generated document, generation date, generated by, print action/status.
5. `Circuit signature DG`
   - printed/sent/signature statuses, DG signed scan upload/download.
6. `Rendez-vous de retrait`
   - withdrawal meeting date/location/status, reused meeting card style.
7. `Scan final signe/cachete`
   - final scan signed/cacheted by DG and signed/acknowledged by postulant.
8. `Actions disponibles`
   - only the valid next action, matching the preliminary workspace style.

For OMA-OPS-8A, before backend exists, implement a read-only readiness tab from existing `AdminDossierDetail`:

- Show whether dossier is in `delivery_phase`.
- Show delivery phase record if present.
- Show current blockers: earlier phase support not implemented, no certificate record, no template linked in dossier detail.
- Do not show fake generation or mutation controls.

## Permissions proposal

Add permissions:

- `CERTIFICATE_VIEW`
- `CERTIFICATE_GENERATE`
- `CERTIFICATE_UPDATE_STATUS`
- `CERTIFICATE_UPLOAD_SCAN`
- `CERTIFICATE_CLOSE_DELIVERY`

Role mapping proposal:

| Action | dn_agent | dn_supervisor | admin | dg_secretariat |
| --- | --- | --- | --- | --- |
| View certificate | yes | yes | yes | optional read-only |
| Generate certificate | yes | yes | yes | no |
| Mark printed/sent DG | yes | yes | yes | optional |
| Upload signed scan | yes | yes | yes | yes if secretary scans |
| Plan withdrawal meeting | yes | yes | yes | no |
| Mark collected | yes | yes | yes | no |
| Close delivery phase | yes | yes | yes | no |

Postulants should not receive mutation rights. Portal exposure should remain read-only: status, withdrawal meeting, and possibly final availability depending on PO decision.

## MVP vs later

MVP:

- Read-only Certificat tab readiness state.
- Backend certificate model/API.
- Manual lifecycle/status tracking.
- Template selection from existing `DocumentTemplateModel`.
- Generated certificate document as a stored artifact.
- Physical DG signature/cachet tracking by status and scan upload.
- Withdrawal meeting using `MeetingModel`.
- Final signed scan required before delivery closure.
- Strict permissions and route guards.

Later:

- Rich DOCX/PDF merge engine and certificate-specific field validation.
- Certificate number auto-generation rules if PO confirms format.
- Full DG circuit task integration for certificate signature.
- Automatic email/notification for withdrawal invitation.
- Portal certificate copy download if legally allowed.
- Immutable certificate event log and audit/report integration.
- Versioned certificate templates and historical template snapshotting.

## Implementation slices

### OMA-OPS-8A - Readonly tab

Frontend-only. Replace `DossierCertificatTab` placeholder with a read-only readiness tab using existing `AdminDossierDetail`. Show delivery phase status, organization/postulant/dossier fields, target lifecycle preview, and backend gaps. No actions.

### OMA-OPS-8B - Certificate model/API

Backend and frontend API types. Add `CertificateModel`, certificate permissions, admin routes, `getAdminDossier` serializer extension, certificate document download allowlist, and basic read/status endpoints.

### OMA-OPS-8C - Generation from template

Add active certificate template lookup, certificate number/delivery metadata input, generated artifact storage, and generated-document download. Start with deterministic server-side generation only if a rendering library/approach is approved; otherwise allow registering an externally prepared generated certificate.

### OMA-OPS-8D - DG signature/retrait workflow

Add status transitions for printed, sent to DG, DG signed scan upload, withdrawal meeting planning, collected/signed by postulant, final scan upload, and delivery phase close. Reuse `MeetingModel` with a new `certificate_withdrawal_meeting` type.

## Risks / open questions

- Official certificate number format is not confirmed.
- Difference between recognition certificate and approval certificate needs PO validation.
- Certificate-specific fields by dossier type are not defined.
- Whether the postulant may download a certificate copy is not confirmed.
- Whether DG secretariat uploads certificate scans or DN does it is operationally open.
- Whether certificate DG signature should use `DGReview` tasks in MVP is a product/role decision.
- Delivery phase also includes fee/payment evidence and Phase V closure courriers, which are not implemented yet.
- Existing mock certificate statuses differ from the target lifecycle and should not be treated as API design.

## Verification commands run

- None. Planning-only pass.

## Manual checks

- Not run. Planning-only pass.

## Next step

Await approval for OMA-OPS-8A readonly Certificat tab implementation.

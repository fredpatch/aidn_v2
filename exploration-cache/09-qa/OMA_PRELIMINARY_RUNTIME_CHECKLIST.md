# OMA Preliminary Phase - Runtime Validation Checklist

Last run: 2026-05-21
Result: 13/13 PASS

## Prerequisites

- API running on `http://localhost:4000`
- Bootstrap admin credentials: `admin@aidn.local / password`
- At least one dossier in `preliminary_phase` status (created via ADMIN-4 open-dossier-dn)
- One portal postulant user linked to that dossier's `postulantUserId`

## Checklist

### Admin read endpoints

- [ ] `GET /api/v1/admin/dossiers` returns 200 with `items[]`, each item has `organization.canonicalName` and `postulant.fullName`
- [ ] `GET /api/v1/admin/dossiers/:id` returns 200 with 5 phases, `preliminary` block, `preliminary.phase.preliminaryStatus` is `null` on fresh dossier

### Preliminary state machine - admin actions

- [ ] `POST .../preliminary/invite-first-meeting` → 201, meeting `status=invited`, `outlookEmailStatus=to_be_sent_manually`; re-read shows `preliminaryStatus=first_meeting_invited`, `phase.status=waiting_meeting`
- [ ] `POST .../preliminary/record-first-meeting` (with PDF file) → 200, meeting `status=held`, `reportDocumentId` set; re-read shows `preliminaryStatus=first_meeting_held`
- [ ] `POST .../preliminary/publish-pre-evaluation-form` (with PDF file) → 201, `documentId` returned; re-read shows `preliminaryStatus=pre_eval_form_available`, `phase.status=waiting_postulant`, `preEvaluationTemplateDocumentId` set

### Portal postulant actions

- [ ] `GET /api/v1/portal/dossiers/:id` → 200, `portalLabel="Action requise - Formulaire disponible"`, `canSubmitForm=true`, `preEvaluationFormDocumentId` set
- [ ] `POST .../preliminary/upload-pre-evaluation-form` (with PDF file) → 201 `{"ok":true}`; re-read shows `status=pre_eval_form_submitted`, `canSubmitForm=false`, `hasCompletedForm=true`, `portalLabel="En attente d'analyse"`

### Preliminary meeting - admin actions

- [ ] `POST .../preliminary/invite-preliminary-meeting` → 201, `meetingType=preliminary_meeting`; re-read shows `preliminaryStatus=preliminary_meeting_invited`
- [ ] Re-invite (same endpoint again) → 409 with French message
- [ ] `POST .../preliminary/record-preliminary-meeting` (with PDF file) → 200, `reportDocumentId` set; re-read shows `preliminaryStatus=preliminary_meeting_held`, `preliminaryMeetingReportDocumentId` set

### Closure flow

- [ ] `POST .../preliminary/close` before upload-closure-courrier → 409 "La phase préliminaire n'est pas prête à être clôturée."
- [ ] `POST .../preliminary/upload-closure-courrier` (with PDF file) → 201; re-read shows `preliminaryStatus=preliminary_ready_to_close`, `phase.status=ready_to_close`
- [ ] `POST .../preliminary/close` → 200 `{"ok":true}`; re-read: dossier `status=formal_request_phase`, preliminary phase `status=closed`, `formal_request` phase `status=in_progress`
- [ ] All 5 mutation endpoints (invite-first-meeting, record-first-meeting, invite-preliminary-meeting, upload-closure-courrier, close) → 409 after closure

## Known test credentials (development only)

- Bootstrap admin: `admin@aidn.local / password`
- Portal user (Asky/Alex SABA): `alex@gmail.com / password`
- Portal user (Fly Gabon/Boris Klinton): `boris@gmail.com / password`
- Dossier IDs from 2026-05-21 run: `6a0ec71171fe95bfc9352ac4` (Asky), `6a0ebdcc573fb124ca53afdc` (Fly Gabon)

## Guard tests (optional)

- [ ] Portal user accessing a dossier belonging to another user → 404
- [ ] Internal admin accessing portal endpoint without portal cookie → 401/403
- [ ] Missing file on required-file endpoints → 400 "X est requis"
- [ ] Unsupported MIME type → 400 "Type de fichier non supporté"

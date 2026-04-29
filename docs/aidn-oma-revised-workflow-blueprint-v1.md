# AIDN OMA Revised Workflow Blueprint v1

## 1. Purpose

This document is a planning blueprint for correcting the AIDN OMA mock UI workflow before any backend, database schema, or final data model work.

It consolidates the official OMA workflow from the cahier des charges, the feasibility study, and DN clarifications so the prototype can reflect the real administrative process more closely. It is not an implementation specification and should remain open to product-owner validation.

## 2. Core Principle

AIDN is a semi-digital traceability and workflow support system.

- Physical and digital inputs are accepted.
- The official DG/DN administrative circuit may remain physical.
- AIDN captures scans, evidence, status, notifications, and next actions.
- AIDN does not imply full dematerialization of the legal or administrative process.

The application should therefore trace what happened and guide the next action, without pretending that official courrier, signature, cachet, certificate production, or DG instruction are fully automated in version 1.

## 3. Actors

| Actor | Role in the revised mock workflow |
| --- | --- |
| Postulant / Industrie | External requester. Can submit demandes, provide documents, attend meetings, provide payment proof, and collect certificates. |
| DG | Direction Generale. Keeps an official administrative instruction circuit, currently physical. |
| DN | Direction de la Navigabilite. Main operational owner of the OMA workflow and dossier follow-up. |
| EC | Equipe de certification. Can produce or transmit meeting records and phase closure courriers. |
| S5 / compta | Billing touchpoint for study, audit, and certificate delivery invoices. |
| R3 | Compliance opinion touchpoint during Phase 4. |
| Reception / assistant DN | Can register physical deposits, scan returned courriers, upload evidence, and support DN operations. |

EC, S5, and R3 are touchpoints in the prototype, not full standalone modules yet.

## 4. Correct Global Workflow

1. Demande initiale is submitted through the portal or deposited physically at ANAC.
2. Courrier and DG instruction follow the official physical administrative circuit.
3. DN scans or uploads the returned DG courrier and related evidence.
4. A Dossier DN can be opened after favorable DG instruction/orientation.
5. DN runs the five OMA phases.
6. Each phase stores evidence: documents, courriers, payment traces, meeting records, decisions, external opinions, and notifications where relevant.
7. Phase closure relies on a formal closure courrier.
8. The certificate is manually printed, signed, cacheted, scanned back into AIDN, and tracked until withdrawal/remise.
9. Reports track durations, volumes, requests, phase progress, and delivered certificates.

## 5. Internal vs Postulant-Facing Status Rule

Internal statuses are operational and can mention DG, DN, courrier, R3, S5, EC, scans, instructions, and administrative circuits.

Postulant statuses must be simplified, readable, and action-oriented. They should tell the postulant what is happening or what action is expected, without exposing internal administrative vocabulary.

The postulant should not see internal terms like:

- Instruction DG recue
- En circuit DG
- Orientee DN
- Courrier vise scanne
- Avis R3 attendu
- S5 en attente

## 6. Recommended Internal Status Vocabulary

### Demande internal statuses

- Brouillon
- Soumise
- Courrier initial recu
- En circuit DG
- Retour DG recu
- Instruction DG enregistree
- Prete pour ouverture dossier DN
- Dossier DN ouvert
- Reorientee
- Rejetee
- Cloturee

### Courrier internal statuses

- Recu
- Scanne
- A transmettre DG
- Transmis DG
- Retour DG recu
- Vise / cachete scanne
- Instruction enregistree
- Archive

### Dossier DN internal statuses

- Ouvert
- En traitement
- En attente document
- En attente paiement
- En attente avis externe
- Suspendu
- Pret pour certificat
- Certificat pret au retrait
- Cloture

### Phase OMA internal statuses

- Non demarree
- En cours
- En attente documents
- En attente paiement
- En attente avis externe
- Courrier cloture attendu
- Cloturee
- Bloquee

### Document internal statuses

- Attendu
- Recu
- Scanne
- A verifier
- Valide
- Rejete
- Remplace

### Certificate internal statuses

- A preparer
- Imprime
- Signe/cachete
- Scanne dans AIDN
- Pret au retrait
- Remis
- Archive

## 7. Recommended Postulant-Facing Status Vocabulary

- Demande recue
- En cours d'examen administratif
- Action requise de votre part
- Reunion a planifier
- Reunion programmee
- Dossier en cours de traitement
- Documents en cours d'analyse
- Paiement attendu
- Inspection / analyse en cours
- Decision disponible
- Phase cloturee
- Certificat en preparation
- Certificat pret au retrait
- Certificat remis
- Demande non retenue
- Dossier cloture

| Internal status family | Example internal status | Suggested postulant label | Reason |
| --- | --- | --- | --- |
| Demande | Soumise | Demande recue | Confirms reception without exposing internal routing. |
| Demande | En circuit DG | En cours d'examen administratif | Hides DG circuit detail while showing progress. |
| Demande | Prete pour ouverture dossier DN | Dossier en cours de traitement | Avoids the internal "orientation DN" vocabulary. |
| Courrier | Retour DG recu | En cours d'examen administratif | A returned courrier is internal evidence, not a portal milestone. |
| Courrier | Vise / cachete scanne | En cours d'examen administratif | Scan/cachet details remain internal. |
| Dossier DN | En attente document | Action requise de votre part | Turns an internal blocker into a clear action. |
| Dossier DN | En attente paiement | Paiement attendu | Uses the postulant's required action. |
| Phase OMA | En attente avis externe | Inspection / analyse en cours | Avoids exposing R3 or other internal actors. |
| Phase OMA | Courrier cloture attendu | Phase cloturee | Only show closure once validated, not the internal pending state. |
| Document | A verifier | Documents en cours d'analyse | Makes document review understandable. |
| Certificate | Signe/cachete | Certificat en preparation | Physical signature/cachet remains internal. |
| Certificate | Pret au retrait | Certificat pret au retrait | This is useful and actionable for the postulant. |

## 8. Revised Phase 1 - Phase preliminaire

Trigger:

- A demande initiale is received from the portal or through physical deposit at ANAC.

Actors:

- Postulant / Industrie
- DG
- DN
- EC or DN
- Reception / assistant DN where scanning or registration support is needed

Physical steps:

- The demande initiale can come from the portal or physical deposit.
- DG instruction remains physical.
- DG returns the instructed/signed/visa courrier to DN.
- The postulant signs the meeting compte rendu on site.
- The pre-evaluation form follows the same physical/DG return principle.

Digital capture in AIDN:

- DN scans the returned DG courrier into the postulant/dossier file.
- Saving the returned courrier should prompt meeting planning.
- DN uploads the signed meeting compte rendu and formulaire.
- DN uploads the decision and triggers a notification.
- EC or DN uploads the final compte rendu and Phase 1 closure courrier.

Required evidence:

- Initial demande or physical deposit registration
- Returned DG courrier
- Meeting convocation
- Signed meeting compte rendu
- Pre-evaluation form
- Returned/visa pre-evaluation form where applicable
- DN decision
- Phase 1 closure courrier
- Closure notification trace

Notification behavior:

- Notify the postulant when a meeting must be planned or is programmed.
- Notify the postulant when a decision is available.
- Validation of the Phase 1 closure upload should trigger email/notification about Phase 1 closure.

Phase exit condition:

- Phase 1 is closed only when the closure courrier and required evidence are uploaded and validated.

## 9. Revised Phase 2 - Demande formelle

The postulant submits the formal dossier and uploads required documents through the portal where possible.

Physical deposit remains accepted during the sensitization period. Uploads should not be compulsory at first because some postulants may still need time and support to adopt the new method.

The DG instruction pattern repeats:

1. Formal dossier received.
2. DG acknowledges or instructs through the official circuit.
3. DN receives and scans/uploads returned DG courrier.
4. DN invites the postulant to the formal meeting.
5. DN uploads the meeting report, recevability courrier, and Phase 2 closure courrier.

The mock should show formal dossier progress as a checklist:

- Documents expected
- Documents uploaded by portal
- Documents deposited physically
- Documents received/scanned
- Documents missing
- Documents to verify

## 10. Revised Phase 3 - Evaluation approfondie

S5/compta sends the invoice for study fees. Billing remains managed by another direction for the time being.

Invoice handling should be represented as traceability, not a full billing module:

- Invoice may be uploaded by reception.
- Invoice may be uploaded by assistant DN.
- A later version may allow S5 to upload directly.
- Payment proof can be uploaded by the postulant or assistant DN.
- DN uploads the Phase 3 closure letter.

Required evidence:

- Study-fee invoice
- Payment proof or quittance
- Phase 3 closure letter

## 11. Revised Phase 4 - Demonstration et inspection sur site

S5/compta sends the audit invoice. The invoice and payment proof are captured in the dossier.

R3 shares a compliance opinion with DN. R3 is a touchpoint for now, not a complete standalone module in the prototype.

Future options:

- Give R3 an AIDN account with limited access to ongoing studies.
- Interoperate with an R3 application so R3 can provide its opinion from its own tool.

Current mock behavior:

- Track audit invoice.
- Track payment proof.
- Track R3 opinion as received, attached, or pending internally.
- DN uploads the Phase 4 closure letter.

## 12. Revised Phase 5 - Delivrance

S5/compta sends the certificate delivery invoice. The payment proof is captured.

DN then:

1. Uploads Phase 5 closure plus approvals/acceptances.
2. Prints the certificate.
3. Gets the certificate signed and cacheted physically.
4. Scans/uploads the signed certificate into AIDN.
5. Marks the certificate as ready for withdrawal.
6. Tracks invitation, withdrawal, and remise.

The certificate page should make clear that AIDN tracks production and withdrawal status, while the official certificate remains manually printed, signed, and cacheted.

## 13. Revised Prototype Page Flow

Admin/DN flow:

- Dashboard
- Demandes
- Courriers / Instruction DG
- Dossiers DN
- Dossier detail
- Workflow OMA
- Documents
- Reunions / Convocations
- Certificats
- Rapports

Future portal flow:

- Mes demandes
- Mes dossiers
- Documents a fournir
- Reunions
- Factures / Paiements
- Decisions recues
- Certificat / retrait
- Notifications

## 14. Dossier Detail Workspace Plan

The dossier detail should become the main operational workspace.

Recommended sections:

- Vue d'ensemble
- Origine / Courriers DG
- Phase 1 - Preliminaire
- Phase 2 - Demande formelle
- Phase 3 - Evaluation approfondie
- Phase 4 - Inspection / R3
- Phase 5 - Delivrance
- Documents
- Reunions
- Certificat
- Historique

Each phase should show:

- Current phase status
- Expected documents
- Received/scanned documents
- Physical steps pending
- S5/R3/EC touchpoints where relevant
- Closure courrier
- Notifications sent
- Next recommended action

## 15. Mock UI Corrections Needed Later

- Separate `internalStatus` and `portalStatus` in mock data.
- Add `entryChannel` to demandes.
- Add scan/return metadata to courriers.
- Add phase evidence blocks.
- Add required document checklist.
- Add invoice/payment traces for phases 3, 4, and 5.
- Add R3 opinion trace for phase 4.
- Update certificate lifecycle.
- Align reports to official indicators.

## 16. Out of Scope For Now

- Backend implementation
- Database schema
- Real file upload
- Real email sending
- Real export
- Certificate generation
- QLOG integration
- Full S5 module
- Full R3 module
- Full DG interface

## 17. Next Implementation Sequence

- O2: Separate internal vs portal statuses in mock types/data/UI labels.
- O3: Rework dossier detail into phase workspace.
- O4: Add phase evidence/checklist mock layer.
- O5: Update certificate lifecycle.
- O6: Align reports to official indicators.
- O7: Add demo portal preview only after admin flow is stable.

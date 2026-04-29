# AIDN OMA Workflow Source Notes

Source reviewed: `Cahier_des_charges.docx`  
Review purpose: capture official workflow knowledge needed to improve the mock UI MVP data model without inventing business rules.

Status: draft source summary. This file should be updated as the product owner, DN, DG, and IT clarify details.

## Project Context

Project/application name: Application Informatique de la Direction de la Navigabilite (AIDN).

Requesting direction: Direction de la Navigabilite.

Requesting services:

- Organismes de Maintenance des Aeronefs (OMA)
- Navigabilite

Current work mode described in the source:

- Manual work supported by computers, Excel files, Word files, Outlook communication, and QLOG for process management.
- Information and statistics are difficult to centralize.
- Incoming, outgoing, and informational courriers are difficult to track around a precise subject.
- Meetings and work sessions are tracked across internal ANAC, local, national mission, and foreign mission contexts.

Expected improvement:

- Centralize data.
- Improve visibility.
- Facilitate exchanges with industry.

## Main Users / Actors

| Actor | Description from source | Initial interpretation for MVP model |
| --- | --- | --- |
| Industrie / Postulant (P) | Submits the demande and associated documents | External requester or organization user |
| Direction Generale (DG) | Instructs the dossier | Receives submissions, acknowledges reception, instructs DN, sends visa/courrier to DN |
| Direction de la Navigabilite (DN) | Processes the dossier | Main operational owner of OMA workflow |
| Equipe de certification (EC) | Sends some meeting records and phase closure courriers | DN certification team or working group |
| S5 | Sends invoices for study, audit, and certificate delivery fees | Billing/payment-related process actor |
| R3 | Shares compliance opinion with DN | Compliance/review actor |

Open questions:

- Are EC, S5, and R3 system roles, organizational units, or process labels?
- Does DG "instruit le dossier" mean formal assignment, validation, orientation, or all of these?
- Should "Industrie" and "Postulant" be separate concepts or one actor in the MVP?

## Official OMA Workflow

The OMA process in the source is titled:

`Reconnaitre, delivrer, modifier, renouveler un agrement d'organisme de maintenance des aeronefs (OMA)`

The workflow is composed of 5 phases:

1. Phase preliminaire
2. Phase de demande formelle
3. Phase d'evaluation approfondie des documents
4. Phase de demonstration et inspection sur site
5. Phase de delivrance

Important rule from the source:

- Passage from one phase to another is materialized by a formal courrier closing the previous phase.

Model implication:

- Phase transition should likely not be represented as a simple status change only.
- Each phase closure should link to at least one formal courrier/document.
- The mock model should eventually represent `phaseClosureCourrierId` or equivalent.

## Phase 1 - Phase Preliminaire

Observed steps:

1. P creates a demande.
2. P fills a demande message and contacts.
3. DG receives the demande.
4. DG sends an acknowledgement of reception to P.
5. DG instructs DN.
6. DG sends the signed/visa courrier to DN.
7. DN invites P to a meeting.
8. DN sends invitation notification to P by email and application.
9. DN gives P the pre-evaluation declaration form and meeting record.
10. DN sends the form and meeting record to P by email and application.
11. P sends the completed pre-evaluation declaration form to DG.
12. P uploads the completed pre-evaluation declaration form.
13. DG receives the pre-evaluation declaration.
14. DG sends an acknowledgement of reception to P.
15. DG instructs DN.
16. DG sends the signed/visa pre-evaluation declaration to DN.
17. DN sends the decision to P and invites P to the preliminary meeting.
18. DN sends the decision and invitation notification to P by email and application.
19. EC sends the preliminary meeting record and Phase I closure courrier.
20. EC sends the closure courrier to P by email and application.

Information to manage:

- Organization name
- Legal address
- Phone
- Email
- Original approval number, if applicable
- Courriers, forms, and decision documents
- Minimum 8 PDF elements

Mock model implications:

- A simple `demande` record is not enough for Phase 1.
- Phase 1 needs demande contacts, DG acknowledgements, DG-to-DN transfers, DN invitations, meeting records, decision, and closure courrier.
- Current mock can remain simplified, but future realism needs a richer document/courrier/event model.

Open questions:

- What is the exact name/reference of the pre-evaluation declaration form?
- Is the first DN meeting distinct from the preliminary meeting?
- What decisions can DN transmit after pre-evaluation?
- Does DG receive all postulant uploads first, or can some go directly to DN?

## Phase 2 - Phase De Demande Formelle

Observed steps:

1. P submits the formal application dossier.
2. P uploads required documents.
3. DG receives the formal application dossier.
4. DG sends acknowledgement of reception to P.
5. DG instructs DN.
6. DG sends the signed/visa courrier to DN.
7. DN sends invitation courrier for the formal meeting to P.
8. DN sends invitation notification to P by email and application.
9. DN sends the formal meeting record, admissibility courrier, and Phase II closure courrier.

Documents listed in the source:

- Official OMA approval request letter
- Form DN-AIR-R2-3-F-E-010 for OMA approval request
- Forms DN-AIR-R2-3-F-E-012 for acceptance of management personnel
- CV and all required qualifications for management personnel
- Certification staff list
- Maintenance Procedures Manual (MPM)
- Quality Manual, if not integrated into the MPM
- SMS/SGS Manual
- Capability list, unless integrated into the MPM
- Training manual or program, unless integrated into the MPM
- Copies of subcontractor contracts or letters of intent
- Required technical documents related to structure capability, including manual revision information
- Compliance statement with current regulation, according to form DN-AIR-R2-3-F-E-011

Information to manage:

- Courriers and forms
- Minimum 35 PDF elements

Mock model implications:

- Formal application should likely have a required document checklist.
- Some document requirements are conditional.
- Personnel acceptance forms are repeated records, not a single file.
- The document model should support document category, official form code, mandatory/conditional flag, source, phase, and validation status.

Open questions:

- Are all listed documents mandatory for initial, renewal, modification, and recognition cases?
- Which documents are conditional by request type?
- What is the official admissibility status vocabulary?

## Phase 3 - Phase D'Evaluation Approfondie Des Documents

Observed steps:

1. S5 sends invoice for dossier study fees to P.
2. P sends proof of payment for study fees.
3. P uploads payment receipt/quittance.
4. DN sends Phase III closure letter to P.

Information to manage:

- Courrier
- Invoice
- Payment receipt/quittance
- Minimum 3 PDF elements

Mock model implications:

- Fees/invoices and payment proof are important workflow objects.
- Payment evidence may gate phase progression.
- Current mock document statuses may need payment-specific categories.

Open questions:

- Does DN perform technical document review during this phase in addition to payment handling?
- What statuses exist for invoice sent, payment received, payment accepted, and phase closed?
- Does S5 interact through AIDN or only through notification/email?

## Phase 4 - Phase De Demonstration Et Inspection Sur Site

Observed steps:

1. S5 sends invoice for audit phase fees to P.
2. P sends proof of payment for audit fees.
3. P uploads payment receipt/quittance.
4. R3 shares its opinion with DN on P's compliance level.
5. R3 sends opinion notification to DN by email and application.
6. DN sends Phase IV closure letter to P.

Information to manage:

- Courrier
- Soit-transmis
- Invoice
- Payment receipt/quittance
- Minimum 4 PDF elements

Mock model implications:

- R3 opinion should be modeled explicitly or as a document/event with actor R3.
- Inspection/audit phase likely needs site visit details, findings, compliance status, and closure courrier.
- Current "meeting" model may not be enough to represent an inspection.

Open questions:

- What is the structure of R3's compliance opinion?
- Is "soit-transmis" a distinct courrier type?
- Are inspection findings required before Phase IV closure?

## Phase 5 - Phase De Delivrance

Observed steps:

1. S5 sends invoice for certificate delivery fees to P.
2. P sends proof of payment for certificate delivery fees.
3. P uploads payment receipt/quittance.
4. DN sends Phase V closure letter and approvals/acceptances to P.
5. DN invites P to withdraw the recognition certificate or OMA approval certificate.
6. DN sends withdrawal invitation notification to P by email and application.

Information to manage:

- Courriers
- Invoice
- Payment receipt/quittance
- Minimum 13 PDF elements

Mock model implications:

- Certificate delivery is preceded by fee/payment evidence and Phase V closure.
- "Recognition certificate" and "OMA approval certificate" may be different certificate types.
- Certificate lifecycle should include prepared/approved/available for withdrawal/withdrawn or delivered/archive concepts, but exact official terms need validation.

Open questions:

- What is the official certificate number format?
- What is the difference between recognition certificate and approval certificate?
- Is physical withdrawal always required?
- What are the official delivery/archive statuses?

## Documents And Files

The source repeatedly specifies PDF elements by phase:

| Phase | Document volume clue |
| --- | --- |
| Phase preliminaire | Minimum 8 PDF elements |
| Phase de demande formelle | Minimum 35 PDF elements |
| Phase d'evaluation approfondie des documents | Minimum 3 PDF elements |
| Phase de demonstration et inspection sur site | Minimum 4 PDF elements |
| Phase de delivrance | Minimum 13 PDF elements |

Model implication:

- The MVP should not treat documents as generic attachments only.
- Documents should eventually be linked to:
  - Request type
  - Phase
  - Actor/source
  - Official form code where applicable
  - Required/optional/conditional rule
  - Submission/reception channel
  - Review status
  - Phase closure role

## Alerts And Notifications

Alerts/notifications requested in the source:

- Creation of demandes by P: alert after 24 hours.
- Sending of documents by P: alert after 24 hours.
- Every transfer from DG to DN.

Notifications mentioned in workflow:

- DN invitation to P by email and application.
- DN sends form/meeting record to P by email and application.
- EC sends closure courrier to P by email and application.
- R3 sends opinion notification to DN by email and application.
- DN sends withdrawal invitation to P by email and application.

Mock model implications:

- Notifications should be represented as traceable workflow events.
- The UI should distinguish "notification represented in mock" from real email sending.
- Timing rules may require due dates or SLA fields.

Open questions:

- What exactly happens after a 24-hour alert?
- Who receives each alert?
- Are reminders repeated or single-shot?
- Should email and in-app notification have separate statuses?

## Reporting Requirements

Reports requested in the source:

- Processing duration for each phase.
- Overall process duration from entry request to issuing approval/recognition certificate.
- Number of approval/recognition requests in a given period.
- Number of approvals/recognitions delivered in a given period.

Mock model implications:

- Dates are critical across demande, DG reception, DG transfer, phase starts/closures, payments, inspections, certificate delivery.
- Reports need period filters and request/certificate type filters.
- Current dashboard/report mock should later align to these official reporting needs.

Open questions:

- What period filters are required: month, quarter, year, custom range?
- Are reports separated by initial, renewal, modification, recognition?
- Are reports DG-facing, DN-facing, or both?

## Access And Security

Source access notes:

- P: restricted access
- DG: restricted access
- DN: complete access

Mock model implications:

- Role visibility should be part of future model refinement.
- DN likely has full workflow visibility.
- P likely sees own submissions, notifications, document requests, invoices, decisions, and certificate withdrawal invitation.
- DG likely sees incoming submissions, acknowledgements, instructions/transfers, and decisions.

Open questions:

- Can DG edit DN workflow records after transfer?
- Can P see internal DN phase status?
- Does S5 or R3 need direct AIDN login access?

## Candidate Data Model Concepts To Revisit

Current prototype concepts:

- Demande
- Courrier
- DG decision
- Dossier DN
- OMA phase
- Document
- Reunion
- Certificate
- Timeline event

Additional concepts suggested by source:

- Organization/contact profile
- Request type: recognition, delivery, modification, renewal
- Acknowledgement of reception
- DG instruction/transfer to DN
- Formal phase closure courrier
- Official form definition
- Required document checklist item
- Invoice/facture
- Payment proof/quittance
- R3 compliance opinion
- Notification
- Phase transition record
- Certificate withdrawal invitation

## Immediate MVP Mock Corrections To Consider Later

Do not apply automatically without product owner validation:

- Rename or align phase labels to the official 5-phase wording.
- Add explicit phase closure courrier relation.
- Add document checklist metadata for Phase II.
- Add fee/invoice/quittance records for Phases III, IV, and V.
- Add transfer events from DG to DN.
- Add 24-hour alert examples for P submissions/documents.
- Distinguish recognition certificate from approval certificate if confirmed.

## Product Owner Follow-Up Checklist

- Confirm exact official phase names and order.
- Confirm request types covered by "reconnaitre, delivrer, modifier, renouveler".
- Confirm statuses for demande, DG instruction, Dossier DN, phases, documents, payments, and certificate lifecycle.
- Provide examples of real courriers and forms for each phase.
- Provide official document checklist with form codes and conditional rules.
- Clarify role permissions for P, DG, DN, EC, S5, and R3.
- Clarify whether notifications are required as audit records.
- Clarify reports, filters, and expected statistics.

## Feasibility Study Addendum

Additional source reviewed: `Etude de faisabilite - AIDN.doc` / `Étude de faisabilité - AIDN.doc`  
Review purpose: extract MVP scope and feasibility recommendations that refine the mock UI data model.

Extraction note:

- The source is an older binary `.doc` file.
- Clean Word automation was not reliable in this local environment, so the relevant text was recovered from the document stream.
- The content below captures the readable MVP-relevant material. It should be confirmed with the product owner before being treated as final specification.

## Feasibility Study - Main Conclusion

The feasibility study positions AIDN as feasible under a progressive, semi-digital approach.

Key principle:

- The first version should not attempt complete dematerialization of the administrative process.
- The MVP should preserve the official physical courrier circuit where needed, while giving AIDN a controlled digital layer for traceability, status visibility, and workflow follow-up.

Model implication:

- The mock should continue to distinguish digital submissions from physical/scanned courriers.
- AIDN should be modeled as a traceability and workflow support system first, not as a fully paperless legal replacement.
- Physical courrier references, scans, DG return dates, and official decision evidence remain important.

## Semi-Digitalization Principle

The feasibility study indicates that the MVP should improve the current circuit without breaking it.

The intended semi-digital path is approximately:

1. Postulant creates or requests an account.
2. Account is manually validated by an authorized agent.
3. Postulant submits a demande.
4. Demande may be linked to a digital deposit or to a scanned/registered physical courrier.
5. DG orientation/decision is tracked.
6. If orientation is favorable toward DN, a Dossier DN is opened.
7. DN follows OMA phases.
8. Documents, meetings, certificate status, and dashboards are tracked.

Model implication:

- `Demande` should not directly imply `Dossier DN`.
- `Courrier` can be digital, physical, scanned, or hybrid depending on PO confirmation.
- `DGDecision` is a separate source-of-truth event or record.
- `Dossier DN` should open only after favorable DG orientation.
- The current mock cross-navigation aligns with this principle, but the data model needs stronger separation between demande, courrier, DG decision, and dossier opening.

## MVP Scope Suggested By Feasibility Study

The MVP should cover:

- Postulant account request.
- Manual account validation.
- Demande submission by postulant.
- Digital deposit of courrier or registration/scan of physical courrier.
- Central tracking of demandes and courriers.
- DG orientation follow-up.
- Recording the DG response/decision.
- Dossier DN opening after favorable orientation.
- Main OMA workflow tracking.
- Document centralization.
- Simple tracking of reunions and convocations.
- Simple certificate production status tracking.
- Status notifications to the postulant.
- Basic dashboards/statistics.

Model implication:

- The mock UI currently represents many of these areas, but missing MVP concepts include account validation, physical scan metadata, explicit DG response recording, notification records, and clearer certificate production status.

## MVP Explicit Non-Scope / Deferred Scope

The feasibility study suggests the MVP should not include:

- Forcing DG to use the application directly from the first version.
- Complete removal of the physical courrier circuit.
- Fully automatic generation of official courriers.
- QLOG integration.
- Complete processing of all other certificate workflows.
- Mobile application.
- Full GED/document archival system.
- Complete billing automation.

Model implication:

- Keep the mock read-only and workflow-oriented.
- Do not model QLOG integration as current MVP behavior.
- Do not imply automatic courrier/certificate generation.
- Do not over-model billing beyond simple invoice/quittance traceability until confirmed.

## Feasibility Study - Priority MVP Modules

The feasibility study appears to classify these as priority or near-priority MVP modules:

| Function / module | MVP interpretation |
| --- | --- |
| Compte postulant | External account request and identity/contact base |
| Validation compte | Manual validation by authorized ANAC/DN agent |
| Soumission demande | Postulant starts administrative request |
| Depot / scan courrier | Supports digital deposit and scanned physical courrier |
| Fonction centrale | Tracks demande, courrier, orientation, dossier, and status |
| Orientation DG | Tracks DG decision path |
| Interface DG complete | Possibly deferred or medium priority |
| Ouverture dossier DN | Opens only after favorable DG orientation |
| Workflow OMA | Core follow-up after Dossier DN opening |
| Gestion documentaire | Essential but not full GED in MVP |
| Reunions / convocations | Simple tracking |
| Suivi certificat | Important, but production/signature may remain manual |
| Notifications de statut | Email or manual support at first |
| Tableaux de bord | Important for value measurement |
| Rapports statistiques | Important, possibly basic in MVP/post-MVP |

## MVP Success Criteria Suggested By Feasibility Study

The MVP can be considered useful if:

- A postulant can request an account and submit a demande.
- A demande can be linked to a digital or scanned physical courrier.
- DG decision can be recorded.
- A demande oriented toward DN becomes a Dossier DN.
- A non-retained or redirected demande is correctly closed or redirected.
- The postulant can see a readable status.
- DN can follow the main OMA phases.
- Documents are centralized.
- Reunions and certificates are tracked at a minimum.
- Responsible users can access usable statistics.

Model implication:

- These are better MVP validation criteria than pure screen completion.
- Future mock data should include at least one example for:
  - favorable DG orientation -> Dossier DN opened
  - rejected/non-retained demande
  - redirected demande
  - demande still awaiting DG
  - active OMA workflow
  - closed phase via formal courrier

## Additional Data Model Concepts From Feasibility Study

The feasibility study strengthens or adds these concepts:

- Postulant account
- Account validation decision
- Organization linked to one or more users
- Digital courrier deposit
- Physical courrier scan
- Official courrier registration
- DG response/decision record
- DG decision evidence attachment
- Dossier opening decision
- Status visible to postulant
- Notification / status update
- Role-specific visibility
- Basic dashboard/statistics indicators

Suggested future model additions:

| Concept | Why it matters |
| --- | --- |
| `PostulantAccount` | MVP starts before demande, with account request/validation |
| `Organization` | Multiple users may represent the same organization |
| `CourrierChannel` | Need to distinguish physical, scan, digital, or hybrid paths |
| `DGDecisionEvidence` | DG response may need scanned/cacheted official support |
| `DossierOpeningRecord` | Dossier DN opening should be explicit and auditable |
| `StatusNotification` | Postulant status visibility is an MVP value |
| `RoleVisibilityRule` | P, DG, DN, S5, R3, IT may not see the same data/actions |

## Feasibility Study - Priority Questions To Resolve

The feasibility document includes or implies detailed clarification questions. These should guide product-owner interviews.

### A. Courrier Circuit

- Who officially records a courrier in AIDN: reception, DN, bureau courrier, or administrator?
- Does a scanned physical courrier have the same value as a digital deposit?
- Is scanned courrier mandatory?
- If a courrier is submitted digitally through the portal, must it still be printed for the DG circuit?
- Are digital and physical versions treated as the same record or distinct records?
- Which dates must be stored: physical deposit, scan, send to DG, return from DG?
- Is a courrier archived in AIDN even if the demande is rejected or redirected?

### B. DG Decision

- What are the possible DG decisions: orient to DN, redirect, reject, put on hold, other?
- Are decisions limited to these values?
- Is DG justification visible to the postulant?
- Who records the DG decision in AIDN?
- Must scanned/cacheted orientation courrier be attached?
- Can a DG decision be modified after recording?
- Does DG need an AIDN account in version 1?
- Is a fuller DG interface planned later?

### C. Postulant Portal

- Who can request an account?
- What information is mandatory for account creation?
- Who validates postulant accounts?
- Are supporting documents required before account validation?
- Can one postulant represent multiple organizations?
- Can multiple users represent the same organization?
- Can a postulant modify a demande after submission?
- Can a postulant withdraw or cancel a demande?
- What statuses should be visible to the postulant?
- Should the postulant receive automatic emails or only consult the portal?

### D. OMA Workflow

- Are the five phases valid for all OMA dossier types?
- Are there differences between initial request, renewal, and modification?
- Can a phase be suspended?
- Can a phase be reopened after correction?
- Who closes each phase?
- What evidence is required to close each phase?
- Can the next phase start before formal closure of the previous phase?
- Can multiple DN agents work on the same dossier?
- Can a dossier be assigned to another agent?
- What delays should be tracked by phase?

### E. Documents

- Which documents are mandatory for each phase?
- Which documents are provided by the postulant?
- Which documents are produced by DN?
- Which documents are produced by DG?
- Which documents are scanned and archived?
- Which documents are generated automatically in the future?
- Are official models/templates already available?
- Are documents PDF-only?
- What is the maximum file size per document?
- Can a document be replaced after submission?
- Should old versions be retained?
- Is there a legal retention period?

### F. Reunions And Convocations

- Which reunions must be tracked in AIDN?
- Are reunions linked to a specific phase?
- Who creates the convocation?
- Is invitation sent by Outlook or AIDN?
- Is it enough to record that an Outlook email was sent?
- Must a meeting report be attached?
- Can the postulant see meetings in their portal?
- Can a meeting be postponed?
- Must participants be recorded?
- Should meetings feed statistics?

### G. Certificate Final

- Is the certificate generated from a template or prepared manually?
- Who prepares the certificate?
- Who verifies it?
- Who signs it?
- Who applies the stamp/cachet?
- Is the signed certificate scanned back into AIDN?
- How is certificate availability communicated to the postulant?
- Should the system generate the certificate number?
- Can the postulant download a copy from the portal?

### H. Roles And Permissions

- What exact roles are required in version 1?
- Is the DG role necessary in the MVP?
- Should reception/bureau courrier have an account?
- Should S5 have an account?
- Should R3 have an account?
- Are there DN supervisors with limited or expanded rights?
- Who can see all dossiers?
- Who can modify statuses?
- Who can export reports?

### I. Data And Migration

- Which Excel files exist today?
- What information do they contain?
- Are the data reliable?
- How many historical dossiers should be imported?
- Should all historical dossiers be imported or only active dossiers?
- Are there non-digital paper archives?
- Should existing official reference identifiers be preserved?

### J. Reports And Statistics

- Which indicators are priority for DN?
- Should reports count received demandes, rejected demandes, and oriented demandes?
- Should delays be tracked between demande, DG, DN, and phase closure?
- Should delays be tracked by OMA phase?
- Should certificates delivered be counted?
- Should dossiers be grouped by status?
- Should reports be exportable to Excel/PDF?
- Who can view reports?

### K. Technical / Exploitation Questions

- Will the application be hosted locally?
- Should it be accessible from the internet?
- Is a DMZ/proxy needed for external portal access?
- Which SMTP server can be used for emails?
- What backup policy is required?
- Who administers the servers?
- Who administers the application?
- Is test/production separation required?
- Does QLOG need to be preserved, replaced, or integrated later?
- Are there sovereignty or hosting constraints?

## Combined Interpretation For Current Mock UI MVP

The cahier des charges defines the complete OMA workflow and official phase content. The feasibility study narrows the first useful product toward a semi-digital MVP.

Combined MVP interpretation:

- Start with the demande/courrier/DG orientation/Dossier DN/OMA workflow chain.
- Keep physical courrier compatibility.
- Track DG decision without requiring a complete DG interface in the first version.
- Make Dossier DN opening explicit and dependent on favorable orientation.
- Track OMA phases with phase closure evidence.
- Centralize documents, but do not attempt full GED in the MVP.
- Track reunions and certificate production lightly.
- Expose readable statuses to postulants.
- Provide basic dashboards and reports.

Most important correction for future mock model:

- The mock should represent AIDN as a semi-digital workflow traceability system, not as a fully automated document generation or official-courrier replacement system.

Here is an update of the workflow of the app.
So after discussing the cahier des charges with DN, i could get these update on the workflow from them, and i think these will help us generate a better prototype.

Phase 1:

- Demande Initiale: That one should be done from the application (can be done from the app portal of the Postulant), but it can also be a drop letter straight at the ANAC.
- DG instruction to DN / DG transmet courrier vise a DN: still physic step, but when the courrier comes back to DN after the DN worked on it, it should be saved/scanned in the app, inside the Postulant dossier.
- DN invite le postulant : when DN save the courrier that came back from the DG (DG instruction about the courrier the Postulant sent), inside the dossier of the postulant, they can be prompt, or have a window to schedule the meeting with the Postulant
- Formulaire de pre-evaluation: After the meeting, the Postulant should sign the compte rendu surplace, then DN will upload it inside the Postulant dossier, with the formulaire
- Formulaire sent back by Postulant: same principle as the demande initiale, the formulaire is printed, sign by DG, then sent to DN
- DN transmet decision: DN will upload the decision to Postulant dossier, which triiggers notification
- EC transmet compte rendu + courrier cloture Phase 1: this step should be outsourced to EC, but can actually be done by DN to, as DN got the abilitation to do EC works too. So when CR is done, they upload the CR to Postulant dossier, when validating the upload, this can automatically send an email to Postulant about the cloture of Phase 1.

Phase 2:

- Postulant soumet dossier formel / Postulant televerse documents requis : this phase, the postulant will upload all the required files from the portal, at first the upload step wont be compulsory, cause some might still need to be sensitized about the new method (almost 12 docs or more would be uploaded)
- DG accuse reception / instruit DN : this step could be reproduce from the other same one
- DN invite a reunion formelle : same as previous step in Phase 1,
- DN transmet compte rendu, courrier de recevabilite, cloture Phase 2

Phase 3:

- S5 transmet facture frais d'etude: for this step, the reception send / upload the invoice in the postulant dossier, or after analysis we can have the compta (S5 processus) log in their section of the app to directly upload the facture in the app in the postulant dossier, or we could have a section in the app to manage files, and DN can check the invoice there, but this step requires a bit more analysis
- Postulant transemt preuve de paiement / Postulant televerse quittance : can be done from the postulant portal, or can be done by the assistant of DN, but the ideal flow would be to be done by the Postulant
- DN transmet lettre de cloture Phase 3

* Billing section is still taken care by another direction for the time being.

Phase 4:

- S5 transmet facture frais d'audit: for this step, the reception send / upload the invoice in the postulant dossier, or after analysis we can have the compta (S5 processus) log in their section of the app to directly upload the facture in the app in the postulant dossier, or we could have a section in the app to manage files, and DN can check the invoice there, but this step requires a bit more analysis
- Postulant transemt preuve de paiement / Postulant televerse quittance : can be done from the postulant portal, or can be done by the assistant of DN, but the ideal flow would be to be done by the Postulant
- R3 partage avis conformite a DN: this is also outsourced, and we can just have the app allow access to R3 role to view on-going studies, and give their opinions, or in the R3 application we could have a small module that will get data from the AIDN app and from there, R3 could give their avis without having to log out of their own app (this favorises interoperability between application)
- DN transmet la lettre de cloture Phase 4: the same again, DN will upload a letter to postulant Dossier to close that phase

Phase 5:

- S5 transmet facture frais de delivrance de certificat: again same workflow
- Postulant transmet preveu de paieement
- DN transmet cloture dee Phase 5 + approbation/acceptations
- DN invite postulant a retirer le certificat: there, DN will print out the certif, sign it, and upload it back to the app, wch makes it ready for collection.

I think with these infos we can revise the workflow, and the Prototype page flow to be as close as possible to the reality.

---

AIDN OMA — Revised Workflow Blueprint v1

1. Core Principle

AIDN should be presented as a semi-digital dossier tracking system.

It does not replace the official physical circuit immediately. The app captures and traces what happened:

physical/digital deposit
→ official DG/DN courrier circuit
→ scan/upload evidence into AIDN
→ guided next action
→ notification where appropriate

The feasibility study confirms this direction: the postulant can initiate a request through the portal or physical deposit, the courrier remains in the official circuit, the DG decision is recorded in the app, and the Dossier DN opens only after favorable orientation.

2. Main Workflow Stages
   Stage A — Demande initiale
   Trigger

The request starts either by:

1. Portal submission by the postulant
2. Physical letter deposited at ANAC
3. Internal entry by DN/reception assistant
   Internal DN view

DN should see:

Demande reference
Postulant
Organisme
Request type
Entry channel
Initial courrier status
Contact details
Submission date
Postulant view

The postulant sees only:

Demande reçue

No DG/DN details yet.

Stage B — Courrier / DG instruction
Reality

DG instruction remains physical. Once the courrier comes back to DN, DN scans/uploads the returned signed/visé courrier into the postulant dossier.

Internal DN view

DN should track:

Courrier reçu
Courrier transmis DG
Retour DG reçu
Courrier DG scanné
Instruction enregistrée
Postulant view

The postulant should not see “DG”, “visé”, “instruction”, or “orientation”.

Better label:

Demande en cours d’examen administratif

This protects internal workflow details while still giving a useful status.

Stage C — Dossier DN opening
Rule

A Dossier DN only starts after DG instruction/orientation allows DN to proceed.

The notes confirm the model should keep Demande, Courrier, DGDecision, and Dossier DN separate, and that a Dossier DN should open only after favorable DG orientation.

Internal DN view

DN should see:

Instruction DG enregistrée
Dossier prêt à ouvrir
Dossier DN ouvert
Agent DN affecté
Phase actuelle
Postulant view

The postulant sees:

Dossier en cours de traitement

Not “Orientée DN”.

3. OMA Workflow Structure

The OMA workflow has five phases, and phase transition should not be modeled as a simple status change because the source says the passage from one phase to another is materialized by a formal closure courrier.

Phase 1 — Phase préliminaire
Phase 2 — Demande formelle
Phase 3 — Évaluation approfondie des documents
Phase 4 — Démonstration et inspection sur site
Phase 5 — Délivrance 4. Revised Phase Flow
Phase 1 — Phase préliminaire
Internal workflow

1. Demande initiale reçue
2. DG instruit physiquement DN
3. DN scanne le courrier visé dans le dossier
4. DN planifie la réunion avec le postulant
5. Réunion tenue
6. Postulant signe le compte rendu sur place
7. DN upload le compte rendu signé
8. DN remet/transmet le formulaire de pré-évaluation
9. Postulant retourne le formulaire
10. Formulaire passe par DG physiquement
11. DN scanne le formulaire visé
12. DN upload la décision
13. Notification au postulant
14. EC ou DN upload le CR final + courrier de clôture Phase 1
15. Notification de clôture Phase 1
    Required evidence in prototype
    Courrier DG visé
    Convocation réunion
    Compte rendu signé
    Formulaire pré-évaluation
    Formulaire pré-évaluation visé
    Décision DN
    Courrier clôture Phase 1
    Notification clôture

The cahier des charges confirms Phase 1 includes the demand, DG acknowledgment/instruction, DN invitation, pre-evaluation form, decision, preliminary meeting record, and Phase I closure courrier.

Postulant statuses
Demande reçue
Réunion à planifier
En attente de formulaire
Décision disponible
Phase préliminaire clôturée
Phase 2 — Demande formelle
Internal workflow

1. Postulant soumet le dossier formel
2. Postulant téléverse les documents requis when possible
3. Physical deposit remains accepted during sensitization period
4. DG accuse réception / instruit DN
5. DN scanne le courrier visé
6. DN invite à la réunion formelle
7. DN upload compte rendu réunion formelle
8. DN upload courrier de recevabilité
9. DN upload courrier clôture Phase 2
10. Notification de clôture Phase 2
    Prototype behavior

Phase 2 should not block everything just because a document is missing. Since DN said upload will not be compulsory at first, the UI should show:

Documents attendus
Documents reçus
Documents déposés physiquement
Documents manquants
Documents à vérifier
Required evidence in prototype
Checklist dossier formel
Courrier DG visé
Convocation réunion formelle
Compte rendu réunion formelle
Courrier recevabilité
Courrier clôture Phase 2

The formal phase includes a large document checklist such as the official request letter, forms DN-AIR-R2-3-F-E-010 and DN-AIR-R2-3-F-E-012, personnel files, MPM, SGS manual, capability list, training program, subcontractor documents, and compliance statement DN-AIR-R2-3-F-E-011.

Postulant statuses
Dossier formel attendu
Dossier formel reçu
Documents à compléter
Réunion formelle à planifier
Dossier formel recevable
Phase de demande formelle clôturée
Phase 3 — Évaluation approfondie des documents
Internal workflow

1. S5/compta émet facture frais d’étude
2. Facture uploadée dans dossier by réception, assistant DN, or later S5
3. Postulant transmet preuve de paiement
4. Preuve/quittance uploadée by postulant or assistant DN
5. DN vérifie la présence des pièces
6. DN upload lettre clôture Phase 3
7. Notification de clôture Phase 3
   Prototype behavior

No billing module yet.

Represent this as traceability:

Facture reçue
Quittance reçue
Paiement à vérifier
Lettre clôture Phase 3
Required evidence
Facture frais d’étude
Quittance/preuve paiement
Lettre clôture Phase 3

The CDC confirms S5 sends the study-fee invoice, the postulant sends/uploads proof of payment, and DN sends the Phase III closure letter.

Postulant statuses
Facture disponible
Paiement attendu
Paiement reçu
Phase d’évaluation clôturée
Phase 4 — Démonstration et inspection sur site
Internal workflow

1. S5/compta émet facture audit
2. Facture uploadée dans dossier
3. Postulant transmet preuve de paiement
4. Quittance uploadée
5. R3 partage avis conformité à DN
6. Avis R3 enregistré or document uploaded
7. DN upload lettre clôture Phase 4
8. Notification de clôture Phase 4
   Prototype behavior

R3 should be a touchpoint, not a full module yet.

Show:

Avis R3 attendu
Avis R3 reçu
Avis R3 joint
Required evidence
Facture audit
Quittance audit
Avis R3 conformité
Lettre clôture Phase 4

The CDC confirms the audit-fee invoice, proof of payment, R3 compliance opinion, and Phase IV closure letter.

Postulant statuses
Facture audit disponible
Paiement audit attendu
Inspection / analyse en cours
Phase inspection clôturée

Avoid showing:

Avis R3 en attente

That is internal.

Phase 5 — Délivrance
Internal workflow

1. S5/compta émet facture délivrance certificat
2. Postulant transmet preuve de paiement
3. Quittance uploadée
4. DN upload clôture Phase 5
5. DN upload approbations/acceptations
6. DN imprime certificat
7. Certificat signé/cacheté physiquement
8. DN scanne/upload le certificat signé
9. Certificat devient prêt au retrait
10. Postulant est invité à retirer le certificat
11. Remise du certificat est tracée
    Prototype behavior

Certificate page should emphasize:

Certificate is manually prepared/signed.
AIDN tracks the signed scanned version and withdrawal status.
Required evidence
Facture délivrance
Quittance délivrance
Lettre clôture Phase 5
Approbations / acceptations
Certificat signé scanné
Invitation retrait
Preuve remise

The CDC confirms the certificate-delivery invoice, payment proof, Phase V closure plus approvals/acceptances, and invitation to withdraw the recognition or OMA approval certificate.

Postulant statuses
Facture délivrance disponible
Paiement délivrance attendu
Certificat en préparation
Certificat prêt au retrait
Certificat remis
Dossier clôturé 5. Internal Statuses vs Postulant Statuses

This is the most important correction.

Rule

Internal statuses are for DN operational control.

Postulant statuses are simplified and action-oriented.

The feasibility study already maps internal statuses to simpler portal labels, including “Demande reçue”, “En attente d’orientation administrative”, “Dossier en cours de traitement”, “Demande réorientée”, “Demande non retenue”, and “Dossier clôturé”.

Internal statuses — DN/Admin
Demande
Brouillon
Soumise
Courrier initial reçu
En circuit DG
Retour DG reçu
Instruction DG enregistrée
Prête pour ouverture dossier DN
Dossier DN ouvert
Réorientée
Rejetée
Clôturée
Courrier
Reçu
Scanné
À transmettre DG
Transmis DG
Retour DG reçu
Visé / cacheté scanné
Instruction enregistrée
Archivé
Dossier DN
Ouvert
En traitement
En attente document
En attente paiement
En attente avis externe
Suspendu
Prêt pour certificat
Certificat prêt au retrait
Clôturé
Phase OMA
Non démarrée
En cours
En attente documents
En attente paiement
En attente avis externe
Courrier clôture attendu
Clôturée
Bloquée
Postulant-facing statuses — Portal

Use fewer labels.

Recommended global portal statuses
Portal status Meaning
Demande reçue The request was received in AIDN or physically registered
En cours d’examen administratif Internal courrier/DG/DN validation is ongoing
Action requise de votre part Postulant must provide a document, form, or payment proof
Réunion à planifier DN will schedule or has requested a meeting
Réunion programmée A meeting date exists
Dossier en cours de traitement DN is processing the OMA dossier
Documents en cours d’analyse DN is reviewing submitted documents
Paiement attendu Invoice/payment proof required
Inspection / analyse en cours Inspection or external review is ongoing
Décision disponible DN has uploaded/transmitted a decision
Phase clôturée A workflow phase has been closed
Certificat en préparation Certificate process is underway
Certificat prêt au retrait The certificate can be collected
Certificat remis Certificate delivery was completed
Demande non retenue The request will not continue
Dossier clôturé The dossier is closed
Statuses to avoid on portal
Instruction DG reçue
Orientée DN
Réorientée vers DG/DN/other direction
Retour DG reçu
Courrier visé scanné
Avis R3 attendu
S5 en attente
EC en attente
Courrier clôture attendu

These remain internal.

6. Revised Prototype Page Flow
   Admin/DN side
   Dashboard
   Demandes
   Courriers / Instruction DG
   Dossiers DN
   Dossier detail
   Workflow OMA
   Documents
   Réunions / Convocations
   Certificats
   Rapports
   Future portal side

Not implemented yet, but should eventually show:

Mes demandes
Mes dossiers
Documents à fournir
Réunions
Factures / Paiements
Décisions reçues
Certificat / retrait
Notifications 7. Revised Dossier Detail Structure

The dossier detail page should become the main workspace.

Recommended sections
Vue d’ensemble
Origine / Courriers DG
Phase 1 — Préliminaire
Phase 2 — Demande formelle
Phase 3 — Évaluation approfondie
Phase 4 — Inspection / R3
Phase 5 — Délivrance
Documents
Réunions
Certificat
Historique
Each phase should show
Current phase status
Expected documents
Received/scanned documents
Physical steps still pending
External touchpoints: S5 / R3 / EC
Closure courrier
Notifications sent
Next recommended action 8. Mock Data Corrections Needed Later

No implementation yet, but the next prototype adjustment should add these mock-only concepts:

EntryChannel
InternalStatus
PortalStatus
CourrierCycle
PhaseEvidence
RequiredDocumentChecklist
PhaseClosureCourrier
InvoiceTrace
PaymentProofTrace
R3OpinionTrace
NotificationTrace
CertificateCollectionTrace

These are not final backend models yet. They are UI realism helpers.

9. Priority UI Corrections After Blueprint
   Priority 1
   Separate internal status and portal status everywhere.
   Priority 2
   Update dossier detail page to be phase-based instead of generic tabs.
   Priority 3
   Show evidence requirements per phase:
   documents, invoice, quittance, R3 opinion, closure courrier.
   Priority 4
   Update certificate lifecycle:
   À préparer → Imprimé → Signé/cacheté → Scanné → Prêt au retrait → Remis → Archivé.
   Priority 5
   Adjust reports to official indicators:
   phase duration, global duration, number of requests, number of certificates delivered.

The CDC identifies reporting needs around phase duration, overall process duration, number of requests, and number of approvals/recognitions delivered over a period.

10. Planning Decision

We should not implement yet.

Next step should be:

Phase O1 — Update the prototype planning document / TASK.md with this revised blueprint

Then implementation can proceed in small UI-only steps:

O2 — status separation internal vs portal
O3 — dossier detail phase workspace
O4 — phase evidence/checklist mock layer
O5 — certificate lifecycle correction
O6 — reports alignment

This keeps the workflow disciplined and prevents us from jumping into backend or premature models.

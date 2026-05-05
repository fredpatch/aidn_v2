# Portal Applicant View

Last reviewed: TODO
Source files inspected: TODO

## Purpose

The portal is for the external postulant. It should show simplified tracking, not internal DN workflow complexity.

## UX rule

Do not concatenate every section on one long page. Use:
- portal home for summary and next action
- dossier detail page for grouped information
- tabs for documents, payments, meetings, notifications, certificate

## Recommended routes

- `/portal-preview` — simplified home
- `/portal-preview/dossiers/:id` — dossier detail

## Recommended sections

### Home

- applicant/organization selector
- active dossier summary
- current simplified status
- next expected action
- last update
- recent updates

### Dossier detail tabs

- Vue d’ensemble
- Documents
- Paiements
- Réunions
- Notifications
- Certificat

## Label rules

Prefer external-facing labels:
- Dossier en cours de traitement
- Action attendue
- Document à fournir
- Notification disponible
- Certificat en préparation

Avoid overexposing internal labels unless needed:
- Orientation DG
- Workflow OMA
- Dossier DN

## Known gap

Current screenshot shows too many blocks concatenated on one page. This should be refactored.

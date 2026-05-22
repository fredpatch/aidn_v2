# AIDN OMA - Prototype Stakeholder Review Pack v1

**Projet :** Application Informatique de la Direction de la Navigabilité - AIDN  
**Périmètre :** Prototype OMA semi-digitalisé  
**Objectif du document :** Support de revue métier avec DN / DG / IT / parties prenantes  
**Statut :** Document de validation workflow - avant backend, base de données et implémentation réelle

---

## 1. Objectif de la revue

Cette revue sert à valider si le prototype AIDN représente correctement le futur workflow métier OMA avant de démarrer une vraie modélisation backend ou une implémentation définitive.

La question principale n’est pas :

> Est-ce que l’interface est jolie ?

La vraie question est :

> Est-ce que ce prototype représente correctement la manière dont le travail doit se faire ?

La revue doit permettre de confirmer :

- le circuit **demande → courrier → instruction DG → dossier DN** ;
- les cinq phases OMA ;
- les documents et preuves attendues ;
- les rôles DN, DG, EC, S5, R3, réception/assistant DN ;
- les statuts internes ;
- les statuts visibles par le postulant ;
- les notifications importantes ;
- le cycle de vie du certificat ;
- les indicateurs de pilotage utiles.

---

## 2. Règles de revue

Pendant la séance, éviter de demander une implémentation immédiate.

Chaque remarque doit être classée dans une des catégories suivantes :

| Catégorie         | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| Workflow          | Le déroulement métier est incorrect ou incomplet             |
| Wording           | Un libellé, statut ou terme métier est incorrect             |
| UI                | L’écran est confus ou mal organisé                           |
| Data              | Une donnée ou un document manque                             |
| Role / Permission | Un acteur ne voit pas ou ne devrait pas voir une information |
| Report / KPI      | Un indicateur est incorrect, inutile ou manquant             |
| Later backend     | Besoin réel, mais à traiter lors de la phase backend         |
| Out of scope      | À exclure du MVP                                             |

Priorité proposée :

| Priorité | Signification                                         |
| -------- | ----------------------------------------------------- |
| Critical | Workflow faux ou risque de confusion institutionnelle |
| High     | Correction nécessaire avant validation MVP            |
| Medium   | Important mais peut être traité après première revue  |
| Low      | Amélioration mineure                                  |
| Parked   | À garder pour une phase ultérieure                    |

---

## 3. Routes du prototype à parcourir

| Ordre | Écran                      | Route             | Objectif                       |
| ----- | -------------------------- | ----------------- | ------------------------------ |
| 1     | Tableau de bord            | `/dashboard`      | Vue d’ensemble DN              |
| 2     | Demandes                   | `/demandes`       | Suivi des demandes initiales   |
| 3     | Courriers / Instruction DG | `/courriers`      | Suivi du circuit courrier / DG |
| 4     | Dossiers DN                | `/dossiers`       | Liste des dossiers ouverts     |
| 5     | Détail Dossier DN          | `/dossiers/:id`   | Workspace principal DN         |
| 6     | Workflow OMA               | `/workflow-oma`   | Vue transversale des phases    |
| 7     | Documents                  | `/documents`      | Centralisation documentaire    |
| 8     | Réunions                   | `/reunions`       | Convocations et comptes rendus |
| 9     | Certificats                | `/certificats`    | Cycle de vie certificat        |
| 10    | Rapports                   | `/reports`        | Indicateurs et statistiques    |
| 11    | Portail postulant démo     | `/portal-preview` | Vue simplifiée côté postulant  |

---

## 4. Scénario 1 - Demande initiale par dépôt physique

### Objectif

Valider le cas où le postulant dépose une lettre physique à l’ANAC.

### Parcours conseillé

1. Ouvrir `/demandes`.
2. Identifier une demande avec canal d’entrée physique.
3. Ouvrir `/courriers`.
4. Vérifier le suivi du courrier.
5. Aller sur `/dossiers` puis `/dossiers/:id` si un dossier DN existe.
6. Vérifier ce que le postulant voit dans `/portal-preview`.

### Histoire métier à présenter

1. Le postulant dépose une demande physique à l’ANAC.
2. Le courrier est enregistré ou scanné par ANAC/DN/réception.
3. Le courrier suit le circuit physique DG.
4. Le courrier revient à DN.
5. DN scanne ou enregistre le courrier retour DG dans AIDN.
6. Si l’instruction est favorable, un dossier DN peut être ouvert.

### Questions à valider

| Question                                                       | Réponse / décision |
| -------------------------------------------------------------- | ------------------ |
| Qui enregistre officiellement le courrier physique dans AIDN ? |                    |
| Qui scanne le courrier physique ?                              |                    |
| Le scan est-il obligatoire ?                                   |                    |
| Faut-il enregistrer la date de dépôt physique ?                |                    |
| Faut-il enregistrer la date d’envoi au DG ?                    |                    |
| Faut-il enregistrer la date de retour DG ?                     |                    |
| Le dossier DN est-il ouvert automatiquement ou manuellement ?  |                    |
| Que doit voir le postulant pendant cette étape ?               |                    |

### Notes

| Observation | Type | Priorité |
| ----------- | ---- | -------- |
|             |      |          |
|             |      |          |

---

## 5. Scénario 2 - Demande initiale via portail

### Objectif

Valider le cas où le postulant initie une demande depuis le portail.

### Parcours conseillé

1. Ouvrir `/portal-preview`.
2. Montrer la demande côté postulant.
3. Ouvrir `/demandes` côté admin.
4. Ouvrir `/courriers` pour discuter du circuit officiel.

### Histoire métier à présenter

1. Le postulant soumet une demande depuis le portail.
2. Le courrier ou fichier initial est disponible dans AIDN.
3. Si la procédure officielle l’exige, le document est imprimé ou transmis dans le circuit physique DG.
4. DN enregistre ensuite le retour DG.

### Questions à valider

| Question                                                       | Réponse / décision |
| -------------------------------------------------------------- | ------------------ |
| Une demande numérique suffit-elle officiellement ?             |                    |
| Le courrier numérique doit-il être imprimé pour le DG ?        |                    |
| Que faire si version numérique et version physique diffèrent ? |                    |
| Le postulant peut-il modifier une demande après soumission ?   |                    |
| Le postulant peut-il retirer ou annuler une demande ?          |                    |
| Quel statut simple doit-il voir ?                              |                    |

### Notes

| Observation | Type | Priorité |
| ----------- | ---- | -------- |
|             |      |          |
|             |      |          |

---

## 6. Scénario 3 - Phase 1 : Phase préliminaire

### Objectif

Valider la phase préliminaire, ses courriers, réunions, formulaires et preuves.

### Parcours conseillé

1. Ouvrir `/dossiers/:id`.
2. Aller à la section **Phase 1 - Préliminaire**.
3. Montrer les preuves attendues.
4. Tester les actions de démonstration si utile : reçu, validé, manquant, action faite.
5. Vérifier l’impact côté `/portal-preview`.

### Histoire métier à présenter

1. DN reçoit le courrier DG visé ou instruit.
2. DN planifie une réunion avec le postulant.
3. Le postulant signe le compte rendu sur place.
4. DN upload le compte rendu signé et le formulaire de pré-évaluation.
5. Le formulaire complété suit à nouveau le circuit DG si nécessaire.
6. DN upload la décision.
7. EC ou DN upload le compte rendu final et le courrier de clôture de Phase 1.
8. Une notification de clôture peut être envoyée.

### Questions à valider

| Question                                                                | Réponse / décision |
| ----------------------------------------------------------------------- | ------------------ |
| La première réunion DN est-elle différente de la réunion préliminaire ? |                    |
| Qui upload le compte rendu signé ?                                      |                    |
| EC doit-il être un rôle dans AIDN ou seulement un acteur métier ?       |                    |
| Le courrier de clôture est-il obligatoire pour fermer la Phase 1 ?      |                    |
| Quelle notification doit partir au postulant ?                          |                    |
| Le postulant doit-il voir la décision complète ou seulement un statut ? |                    |

### Preuves à confirmer

| Preuve / document              | Obligatoire ? | Acteur source | Remarque |
| ------------------------------ | ------------- | ------------- | -------- |
| Courrier DG visé/scanné        |               |               |          |
| Convocation réunion            |               |               |          |
| Compte rendu signé             |               |               |          |
| Formulaire pré-évaluation      |               |               |          |
| Formulaire pré-évaluation visé |               |               |          |
| Décision DN                    |               |               |          |
| Courrier clôture Phase 1       |               |               |          |

---

## 7. Scénario 4 - Phase 2 : Demande formelle

### Objectif

Valider le dossier formel, la checklist documentaire et la possibilité de dépôt physique pendant la période de sensibilisation.

### Parcours conseillé

1. Ouvrir `/dossiers/:id`.
2. Aller à **Phase 2 - Demande formelle**.
3. Ouvrir `/documents`.
4. Comparer les pièces attendues et reçues.
5. Ouvrir `/portal-preview` pour voir la version simplifiée postulant.

### Histoire métier à présenter

1. Le postulant soumet le dossier formel.
2. Il peut téléverser les documents via le portail si possible.
3. Le dépôt physique reste accepté au début.
4. DG accuse réception et instruit DN.
5. DN invite à une réunion formelle.
6. DN upload le compte rendu, le courrier de recevabilité et le courrier de clôture Phase 2.

### Questions à valider

| Question                                                   | Réponse / décision |
| ---------------------------------------------------------- | ------------------ |
| Quels documents sont obligatoires en Phase 2 ?             |                    |
| Quels documents sont conditionnels ?                       |                    |
| Le téléversement doit-il être facultatif au lancement ?    |                    |
| Le portail doit-il afficher les documents manquants ?      |                    |
| Terme officiel : recevabilité, admissibilité, conformité ? |                    |
| Combien de documents minimum sont attendus ?               |                    |

### Checklist documentaire à confirmer

| Document                                        | Obligatoire ? | Condition              | Code officiel | Remarque |
| ----------------------------------------------- | ------------- | ---------------------- | ------------- | -------- |
| Lettre officielle de demande d’agrément OMA     |               |                        |               |          |
| Formulaire DN-AIR-R2-3-F-E-010                  |               |                        |               |          |
| Formulaires DN-AIR-R2-3-F-E-012                 |               |                        |               |          |
| CV et qualifications du personnel d’encadrement |               |                        |               |          |
| Liste du personnel de certification             |               |                        |               |          |
| Manuel des Procédures de Maintenance - MPM      |               |                        |               |          |
| Manuel Qualité                                  |               | Si non intégré au MPM  |               |          |
| Manuel SGS                                      |               |                        |               |          |
| Liste des capacités                             |               | Si non intégrée au MPM |               |          |
| Manuel ou programme de formation                |               | Si non intégré au MPM  |               |          |
| Contrats sous-traitants / lettres d’intention   |               |                        |               |          |
| Documents techniques capacité structure         |               |                        |               |          |
| État de conformité DN-AIR-R2-3-F-E-011          |               |                        |               |          |

---

## 8. Scénario 5 - Phase 3 : Évaluation approfondie et frais d’étude

### Objectif

Valider la représentation du rôle S5/compta sans créer de module de facturation complet.

### Parcours conseillé

1. Ouvrir `/dossiers/:id`.
2. Aller à **Phase 3 - Évaluation approfondie**.
3. Montrer facture, quittance, preuve de paiement, courrier de clôture.
4. Vérifier la vue postulant dans `/portal-preview`.
5. Vérifier les alertes dans `/reports`.

### Histoire métier à présenter

1. S5/compta émet une facture pour les frais d’étude.
2. La facture est uploadée ou enregistrée dans le dossier.
3. Le postulant transmet une preuve de paiement.
4. La preuve est uploadée par le postulant ou par un agent DN/assistant.
5. DN upload la lettre de clôture Phase 3.

### Questions à valider

| Question                                                  | Réponse / décision |
| --------------------------------------------------------- | ------------------ |
| Qui upload la facture dans AIDN ?                         |                    |
| S5 doit-il avoir un accès à AIDN en MVP ?                 |                    |
| Qui valide la preuve de paiement ?                        |                    |
| La preuve de paiement bloque-t-elle le passage de phase ? |                    |
| Quel statut le postulant doit-il voir ?                   |                    |

---

## 9. Scénario 6 - Phase 4 : Inspection / Audit / R3

### Objectif

Valider le traitement de l’avis R3 et du paiement audit.

### Parcours conseillé

1. Ouvrir `/dossiers/:id`.
2. Aller à **Phase 4 - Inspection / R3**.
3. Montrer facture audit, preuve de paiement, avis R3, courrier de clôture.
4. Discuter si R3 doit accéder à AIDN ou passer par interopérabilité.

### Histoire métier à présenter

1. S5/compta émet une facture audit.
2. Le postulant transmet une preuve de paiement.
3. R3 partage un avis de conformité avec DN.
4. DN enregistre ou upload l’avis R3.
5. DN upload la lettre de clôture Phase 4.

### Questions à valider

| Question                                                      | Réponse / décision |
| ------------------------------------------------------------- | ------------------ |
| R3 doit-il être un utilisateur AIDN ?                         |                    |
| Faut-il plutôt une interopérabilité avec une application R3 ? |                    |
| L’avis R3 est-il un document, un statut ou une validation ?   |                    |
| Des constats d’inspection doivent-ils être saisis ?           |                    |
| Qu’est-ce qui autorise la clôture Phase 4 ?                   |                    |

---

## 10. Scénario 7 - Phase 5 : Délivrance et certificat

### Objectif

Valider le cycle certificat : préparation, impression, signature/cachet, scan dans AIDN, retrait, remise, archive.

### Parcours conseillé

1. Ouvrir `/dossiers/:id`.
2. Aller à **Phase 5 - Délivrance** puis section **Certificat**.
3. Ouvrir `/certificats`.
4. Avancer le certificat dans la démo si utile.
5. Vérifier `/portal-preview` pour voir le statut postulant.

### Histoire métier à présenter

1. S5/compta émet la facture de délivrance.
2. Le postulant transmet une preuve de paiement.
3. DN upload la clôture Phase 5 et les approbations/acceptations.
4. DN imprime le certificat.
5. Le certificat est signé et cacheté physiquement.
6. DN scanne le certificat signé/cacheté dans AIDN.
7. Le certificat devient prêt au retrait.
8. Le postulant retire le certificat.
9. La remise est tracée.

### Questions à valider

| Question                                                         | Réponse / décision |
| ---------------------------------------------------------------- | ------------------ |
| Le certificat est-il généré ou préparé manuellement ?            |                    |
| Qui prépare le certificat ?                                      |                    |
| Qui signe ?                                                      |                    |
| Qui appose le cachet ?                                           |                    |
| Le certificat signé doit-il être scanné dans AIDN ?              |                    |
| Le retrait est-il toujours physique ?                            |                    |
| Le postulant peut-il télécharger une copie ? MVP ou plus tard ?  |                    |
| Le numéro certificat est-il généré par AIDN ? MVP ou plus tard ? |                    |

---

## 11. Scénario 8 - Rapports et KPI

### Objectif

Valider les indicateurs de pilotage.

### Parcours conseillé

1. Ouvrir `/reports`.
2. Montrer **Synthèse d’activité**.
3. Montrer **Délais clés**.
4. Montrer **Analyse visuelle**.
5. Montrer **Complétude documentaire / preuves**.

### Histoire métier à présenter

1. La direction visualise le volume des demandes.
2. DN visualise les dossiers ouverts.
3. Les délais globaux et par phase sont suivis.
4. Les certificats remis sont comptés.
5. Les preuves manquantes et courriers de clôture à rattacher sont visibles.

### Questions à valider

| Question                                           | Réponse / décision |
| -------------------------------------------------- | ------------------ |
| Les volumes affichés sont-ils utiles ?             |                    |
| Les délais affichés sont-ils utiles ?              |                    |
| Faut-il isoler le délai DG ?                       |                    |
| Faut-il suivre le délai par phase OMA ?            |                    |
| Faut-il suivre les demandes rejetées/réorientées ? |                    |
| Faut-il exporter Excel/PDF en MVP ?                |                    |
| Qui peut consulter les rapports ?                  |                    |
| Quels KPI manquent ?                               |                    |

---

## 12. Scénario 9 - Portail postulant démo

### Objectif

Valider la visibilité externe, les statuts simplifiés et les actions attendues.

### Parcours conseillé

1. Ouvrir `/portal-preview`.
2. Sélectionner un organisme.
3. Montrer les demandes, actions, documents, réunions, paiements, notifications, certificat/retrait.
4. Comparer avec les informations internes visibles côté DN.

### Règle importante

Le postulant ne doit pas voir les détails internes comme :

- instruction DG reçue ;
- en circuit DG ;
- courrier visé scanné ;
- avis R3 attendu ;
- S5 en attente ;
- EC en attente ;
- décision interne non formulée pour lui.

### Questions à valider

| Question                                          | Réponse / décision |
| ------------------------------------------------- | ------------------ |
| Les statuts postulant sont-ils assez simples ?    |                    |
| Des informations internes sont-elles exposées ?   |                    |
| Les actions attendues sont-elles claires ?        |                    |
| Les documents à fournir sont-ils lisibles ?       |                    |
| Les paiements attendus sont-ils compréhensibles ? |                    |
| Le statut certificat/retrait est-il clair ?       |                    |

---

## 13. Checklist globale à valider avant backend

| Point                                                                                    | Validé ? | Commentaire |
| ---------------------------------------------------------------------------------------- | -------- | ----------- |
| Logique demande → courrier → DG → DN → dossier DN                                        |          |             |
| Qui scanne/upload les courriers physiques                                                |          |             |
| Valeurs possibles de décision/instruction DG                                             |          |             |
| Preuve obligatoire pour décision DG                                                      |          |             |
| Ouverture dossier DN automatique ou manuelle                                             |          |             |
| Les cinq phases OMA sont correctes                                                       |          |             |
| Les mêmes phases s’appliquent à reconnaissance, délivrance, modification, renouvellement |          |             |
| Documents obligatoires par phase                                                         |          |             |
| Documents conditionnels                                                                  |          |             |
| Courrier de clôture obligatoire par phase                                                |          |             |
| Rôle EC                                                                                  |          |             |
| Rôle S5/compta                                                                           |          |             |
| Rôle R3                                                                                  |          |             |
| Cycle certificat                                                                         |          |             |
| Statuts visibles côté postulant                                                          |          |             |
| Notifications importantes                                                                |          |             |
| Rapports/KPI prioritaires                                                                |          |             |
| Éléments à exclure du MVP                                                                |          |             |

---

## 14. Backlog de corrections

| ID    | Area          | Feedback | Type              | Priority | Decision | Owner          | Status |
| ----- | ------------- | -------- | ----------------- | -------- | -------- | -------------- | ------ |
| P-001 | Courrier      |          | Workflow          | Critical |          | DN / IT        | Open   |
| P-002 | Statuts       |          | Wording           | High     |          | DN             | Open   |
| P-003 | Documents     |          | Data              | High     |          | DN             | Open   |
| P-004 | Portail       |          | Visibility        | Medium   |          | DN / IT        | Open   |
| P-005 | Rapports      |          | Report / KPI      | Medium   |          | Direction / DN | Open   |
| P-006 | Backend futur |          | Later backend     | Parked   |          | IT             | Parked |
| P-007 | Rôles         |          | Role / Permission | High     |          | DN / IT        | Open   |
| P-008 | Certificat    |          | Workflow          | High     |          | DN             | Open   |
| P-009 | Paiement      |          | Workflow          | Medium   |          | DN / S5        | Open   |
| P-010 | R3            |          | Workflow          | Medium   |          | DN / R3 / IT   | Open   |

---

## 15. Règles de décision après revue

| Cas                           | Traitement                                  |
| ----------------------------- | ------------------------------------------- |
| Correction de libellé simple  | Peut aller dans une phase UI courte         |
| Correction workflow           | Documenter d’abord, puis corriger prototype |
| Correction document/checklist | Valider avec DN avant modification          |
| Correction statut postulant   | Valider côté DN avant exposition portail    |
| Besoin backend/schema         | Mettre dans backlog MVP backend             |
| Besoin QLOG/intégration       | Mettre post-MVP / étude technique           |
| Besoin DG/S5/R3 complet       | Décider MVP ou phase ultérieure             |
| Demande hors périmètre        | Marquer out of scope                        |

---

## 16. Conclusion de séance

À la fin de la revue, remplir :

| Élément                                              | Décision |
| ---------------------------------------------------- | -------- |
| Le workflow général est-il accepté ?                 |          |
| Le prototype peut-il servir de base au cadrage MVP ? |          |
| Corrections critiques avant validation               |          |
| Corrections importantes mais non bloquantes          |          |
| Éléments à reporter après MVP                        |          |
| Prochaine séance nécessaire ?                        |          |
| Responsable de consolidation                         |          |
| Date cible de prochaine version prototype            |          |

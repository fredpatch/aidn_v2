You are working on the existing frontend-only AIDN OMA prototype.

Current state:

- Phase O8.1 completed: localStorage-backed demo state exists.
- Phase O8.2 completed: dossier evidence interactions and reset are working.
- Phase O8.3 completed: certificate lifecycle demo interactions are working.
- The app remains mock/demo-driven.
- No backend should be introduced.
- localStorage is allowed only for browser demo state.

Goal:
Implement Phase O8.4 only: add controlled meeting and payment demo interactions.

Business rule:
Meeting and payment interactions are demo-only.
They must not imply real Outlook invitations, real email, real payment validation, real upload, backend persistence, or official workflow validation.

Scope:

- Add meeting demo actions.
- Add payment evidence shortcut actions where useful.
- Keep all changes localStorage-backed only.
- Keep labels clearly marked "dans la démo".

Steps:

1. Read:
   - TASK.md
   - client/src/features/aidn/storage/aidn-demo-storage.ts
   - client/src/features/aidn/storage/aidn-demo-actions.ts
   - meeting types/enums
   - phase evidence types/enums
   - client/src/pages/ReunionsPage.tsx
   - client/src/pages/DossierDetailPage.tsx
   - client/src/pages/PortalPreviewPage.tsx if needed

2. Add meeting demo helper actions in aidn-demo-actions.ts:
   Suggested:
   - markMeetingScheduled(meetingId)
   - markMeetingReportAvailable(meetingId)

   These should update local demo state only.
   Use existing fields if available:
   - status
   - reportDocumentId
   - reportAttached
   - convocationSentAt
   - scheduledAt
     If exact fields differ, adapt safely to current mock type.

3. Add payment evidence shortcut helper if useful:
   Suggested:
   - markPaymentEvidenceReceived(evidenceId)
   - markPaymentEvidenceValidated(evidenceId)

   Only apply to evidence kind:
   - invoice
   - payment_proof

   These can update evidence status to:
   - received
   - validated

4. Update /reunions:
   - Add a demo note:
     "Mode démonstration : les réunions sont simulées localement. Aucun email Outlook n’est envoyé."
   - Add actions where appropriate:
     - "Marquer réunion programmée dans la démo"
     - "Marquer compte rendu disponible dans la démo"
   - Keep action disabled/hidden when already done.
   - Invalidate AIDN query data after updates.

5. Update /dossiers/:id if low-risk:
   - In the meetings section, expose the same meeting demo actions.
   - In payment evidence rows, payment-related items may show:
     - "Preuve reçue dans la démo"
     - "Paiement validé dans la démo"
   - Do not duplicate too many buttons if existing evidence controls already cover it. Keep it clean.

6. Portal preview:
   - Keep read-only.
   - Ensure it reflects updated meeting/payment states through existing query refresh.
   - Do not add action buttons there.

7. Use existing toast pattern:
   - "Démo mise à jour localement"

8. Do not add:
   - real upload
   - real email
   - Outlook integration
   - real payment processing
   - backend calls
   - schema/persistence
   - export
   - certificate generation
   - auth changes

9. Run:
   - npx tsc --noEmit
   - npm run build

10. Update TASK.md:

- Mark Phase O8.4 completed if successful.
- Set next action to:
  Phase P - Prototype stakeholder review and correction backlog.

Expected output:

- Short exploration summary
- Files changed
- Implementation summary
- Verification result
- Any issues
- Confirm no backend/schema/real persistence/upload/email/export/payment/certificate generation was introduced

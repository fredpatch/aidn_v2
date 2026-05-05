# Verification Commands

Last reviewed: TODO

## Standard verification

```bash
npx tsc --noEmit
npm run build
```

## Manual checks for portal refactor

- `/portal-preview` loads.
- Home page no longer shows all documents/payments/meetings/notifications/certificates at once.
- Active dossier card is visible.
- Next expected action is visible.
- Dossier detail route opens.
- Tabs switch correctly.
- Portal remains read-only.
- Admin routes remain unchanged.

# Auth And Permissions

Last reviewed: 2026-05-05

## Backend auth
- No backend auth middleware/repository in this repo.

## Frontend auth behavior
- LocalStorage token key: ${STORAGE_PREFIX}_token (from config/app.ts and AuthContext)
- Demo login token: aidn-demo-token (LoginPage)
- Route guards: AuthRoute + ProtectedRoute

## Permission model
- Binary gate only (authenticated or not).
- No role matrix enforcement in code.

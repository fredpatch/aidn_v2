# Frontend Architecture

Last reviewed: 2026-05-05

## Stack
- React 19 + TypeScript + Vite
- React Router
- TanStack Query
- Radix UI primitives
- TailwindCSS

## Boot and providers
- apps/admin/src/main.tsx
  - ThemeProvider
  - MotionWrapper
  - BrowserRouter
  - AuthProvider
  - QueryClientProvider
  - AppSplashScreen + Sonner Toaster

## Route composition
- apps/admin/src/App.tsx
  - AuthRoute wraps /login
  - ProtectedRoute wraps all app routes
  - AdminLayout wraps protected pages

## Main structural layers
- layouts/*: shell and chrome
- pages/*: route screens
- components/*: shared composables and UI primitives
- features/*: domain data and hooks
- lib/*: API/data-mode/util helpers
- contexts/* + hooks/*: app-wide state (auth/theme/etc.)

## Data flow pattern
1. Page calls feature hooks.
2. Hook calls feature API adapter.
3. API adapter branches by DATA_MODE mock/api.
4. In mock mode, data comes from feature mocks or local demo storage.

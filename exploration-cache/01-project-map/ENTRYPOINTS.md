# Entrypoints

Last reviewed: 2026-05-05

## Runtime entry
- apps/admin/src/main.tsx
  - Creates React root
  - Wraps app with ThemeProvider, MotionWrapper, BrowserRouter, AuthProvider, QueryClientProvider
  - Mounts App component and splash/toaster UI

## Router entry
- apps/admin/src/App.tsx
  - Declares all routes using react-router-dom Routes/Route
  - Uses AuthRoute and ProtectedRoute wrappers

## Layout shell entry
- apps/admin/src/layouts/AdminLayout.tsx
  - Hosts Sidebar, Header, Footer, and PageTransition outlet rendering

## Navigation config entry
- apps/admin/src/config/nav.tsx
  - Declares grouped sidebar menu items, including portal preview link

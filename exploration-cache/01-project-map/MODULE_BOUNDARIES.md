# Module Boundaries

Last reviewed: 2026-05-05

## Feature boundaries
- features/aidn: primary domain model + hooks + API adapter + mocks + demo storage/actions
- features/dashboard: dashboard summary mock hook
- features/items: generic CRUD sample with mock/API switch

## UI boundaries
- components/ui: low-level reusable UI primitives (Radix wrappers)
- components/* non-ui: composed app-specific components (auth, nav, dashboard blocks, etc.)
- pages/*: route-level screens
- layouts/*: application shell

## Data access boundaries
- Hooks call feature API adapters.
- API adapters switch by isMockMode().
- AIDN API adapter is currently mock-only in practice (assertMockOnly in API mode).

## State mutation boundaries
- AIDN demo mutations are centralized in features/aidn/storage/aidn-demo-actions.ts.
- Persistent demo state is in localStorage key aidn.demo.state.v1 via aidn-demo-storage.ts.

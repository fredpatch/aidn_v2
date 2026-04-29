# features/

Each feature follows this structure:

```text
features/<feature>/
  types.ts
  mocks/<feature>.mock.ts
  api/<feature>.api.ts
  hooks/use<Feature>List.ts
  hooks/use<Feature>.ts
  hooks/useCreate<Feature>.ts
  hooks/useUpdate<Feature>.ts
  hooks/useDelete<Feature>.ts
  components/<Feature>Page.tsx
```

Hooks call the API adapter. They never import from mocks directly.
Mock functions always call `waitForMockLatency()` first.

# Repo Structure

Last reviewed: 2026-05-05

## Top-level layout
- apps/admin: frontend application (React/Vite)
- docs: workflow/business notes (OMA and portal vocabulary)
- infra: docker-compose and Dockerfile for dev containerized frontend
- exploration-cache: durable exploration documentation
- prompt.md, TASK.md: task prompts

## Frontend location
- apps/admin/src

## Backend location
- No backend service code found in this workspace.
- API utilities exist in frontend (apps/admin/src/lib/api/client.ts) but no server implementation in repo.

## Mock/demo data location
- apps/admin/src/features/aidn/mocks
- apps/admin/src/features/dashboard/mocks
- apps/admin/src/features/items/mocks
- apps/admin/src/features/aidn/storage (localStorage state + mutating demo actions)

## Build/tooling configs
- apps/admin/package.json (scripts)
- apps/admin/vite.config.ts
- apps/admin/tsconfig.json
- apps/admin/.env.example
- infra/docker-compose.yml
- infra/Dockerfile

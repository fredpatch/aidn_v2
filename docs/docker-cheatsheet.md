# Docker Cheatsheet

Quick commands for running AIDN with the Docker files in `infra/`.

## Compose Files

- Local dev stack: `infra/docker-compose.yml`
- Test/shared VM-style stack: `infra/docker-compose.test.yml`

Services:

- `mongo` - MongoDB
- `api` - Express API
- `admin` - back-office Vite app
- `portal` - public portal Vite app

## Start And Stop

From the repository root:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Run in the background:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

Start only one service and its dependencies:

```bash
docker compose -f infra/docker-compose.yml up -d mongo api
```

Stop containers but keep volumes:

```bash
docker compose -f infra/docker-compose.yml down
```

Stop containers and remove volumes:

```bash
docker compose -f infra/docker-compose.yml down -v
```

## Test Stack

```bash
docker compose -f infra/docker-compose.test.yml up -d --build
```

```bash
docker compose -f infra/docker-compose.test.yml down
```

## Useful URLs

Dev stack defaults:

- API: `http://localhost:4000`
- Admin: `http://localhost:5173`
- Portal: `http://localhost:5174`
- Mongo host port: `localhost:27017`

Test stack defaults:

- API: `http://localhost:4400`
- Admin: `http://localhost:5173`
- Portal: `http://localhost:5174`
- Mongo host port: `localhost:27019`

## Logs And Status

List containers in the compose project:

```bash
docker compose -f infra/docker-compose.yml ps
```

Follow all logs:

```bash
docker compose -f infra/docker-compose.yml logs -f
```

Follow one service:

```bash
docker compose -f infra/docker-compose.yml logs -f api
docker compose -f infra/docker-compose.yml logs -f admin
docker compose -f infra/docker-compose.yml logs -f portal
docker compose -f infra/docker-compose.yml logs -f mongo
```

Show recent logs only:

```bash
docker compose -f infra/docker-compose.yml logs --tail=100 api
```

## Execute Commands In Containers

Open a shell:

```bash
docker compose -f infra/docker-compose.yml exec api sh
docker compose -f infra/docker-compose.yml exec admin sh
docker compose -f infra/docker-compose.yml exec portal sh
docker compose -f infra/docker-compose.yml exec mongo mongosh
```

## API First Launch Scripts

The API package exposes these scripts in `apps/api/package.json`:

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "typecheck": "tsc --noEmit -p tsconfig.json",
  "lint": "tsc --noEmit -p tsconfig.json",
  "seed:bootstrap-admin": "tsx src/scripts/seed-bootstrap-admin.ts",
  "seed:document-requirements": "tsx src/scripts/seed-document-requirements.ts"
}
```

After the API container is running for the first time, run the seed scripts:

```bash
docker compose -f infra/docker-compose.yml exec api npm run seed:bootstrap-admin
docker compose -f infra/docker-compose.yml exec api npm run seed:document-requirements
```

Equivalent direct container commands:

```bash
docker exec aidn-api npx tsx src/scripts/seed-bootstrap-admin.ts
docker exec aidn-api npx tsx src/scripts/seed-document-requirements.ts
```

For the test stack:

```bash
docker compose -f infra/docker-compose.test.yml exec api npm run seed:bootstrap-admin
docker compose -f infra/docker-compose.test.yml exec api npm run seed:document-requirements
```

If you are already inside the API container:

```bash
npm run seed:bootstrap-admin
npm run seed:document-requirements
```

Useful API checks:

```bash
docker compose -f infra/docker-compose.yml exec api npm run typecheck
docker compose -f infra/docker-compose.yml exec api npm run lint
docker compose -f infra/docker-compose.yml exec api npm run build
```

Run API checks:

```bash
docker compose -f infra/docker-compose.yml exec api npm run typecheck
docker compose -f infra/docker-compose.yml exec api npm run build
```

Run admin checks:

```bash
docker compose -f infra/docker-compose.yml exec admin npx tsc --noEmit
docker compose -f infra/docker-compose.yml exec admin npm run build
```

Run portal checks:

```bash
docker compose -f infra/docker-compose.yml exec portal npm run typecheck
docker compose -f infra/docker-compose.yml exec portal npm run build
```

Install dependencies inside a service volume:

```bash
docker compose -f infra/docker-compose.yml exec api npm install
docker compose -f infra/docker-compose.yml exec admin npm install
docker compose -f infra/docker-compose.yml exec portal npm install
```

## Rebuild And Restart

Rebuild one service:

```bash
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d api
```

Restart one service:

```bash
docker compose -f infra/docker-compose.yml restart api
```

Recreate one service after env or dependency changes:

```bash
docker compose -f infra/docker-compose.yml up -d --build --force-recreate api
```

## MongoDB

Open Mongo shell:

```bash
docker compose -f infra/docker-compose.yml exec mongo mongosh
```

Use the AIDN database:

```javascript
use aidn
show collections
```

Dump a database from the running container:

```bash
docker compose -f infra/docker-compose.yml exec mongo mongodump --db aidn --out /tmp/aidn-dump
```

Copy files from a container:

```bash
docker cp aidn-mongo:/tmp/aidn-dump ./aidn-dump
```

## Volumes

List project volumes:

```bash
docker volume ls | grep aidnoma
```

Remove stopped containers and unused images:

```bash
docker system prune
```

Remove compose volumes for this project:

```bash
docker compose -f infra/docker-compose.yml down -v
```

## Common Fixes

Reinstall dependencies for one service:

```bash
docker compose -f infra/docker-compose.yml down
docker volume rm aidnoma-dev_api_node_modules
docker compose -f infra/docker-compose.yml up -d --build api
```

If ports are already used, find the process on Windows:

```powershell
netstat -ano | findstr :4400
netstat -ano | findstr :5173
netstat -ano | findstr :5174
```

Then stop the process if appropriate:

```powershell
taskkill /PID <pid> /F
```

## Environment Files

- Dev API env: `infra/api.env`
- Test API env: `infra/api.test.env`
- Admin env used by dev compose: `apps/admin/.env`
- Portal env used by dev compose: `apps/portal/.env`

After changing env files, recreate the affected service:

```bash
docker compose -f infra/docker-compose.yml up -d --force-recreate api
```

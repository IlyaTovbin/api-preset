# Property Management API

Simple Node.js + Express API running in Docker.

## Auth + Testing Preset

This preset includes:

- Versioned API routes (`/api/v1`)
- Auth routes:
  - `POST /api/v1/auth/sign-in`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/sign-out`
- Zod request validation
- JWT access + refresh token flow
- Refresh token storage/rotation with Prisma
- Auth rate limiting with `express-rate-limit`
- Security middleware defaults (`helmet`, strict env-driven CORS, payload limits)
- Vitest + Supertest integration test setup
- Separate testing environment (`.env.testing`)

How to use:

1. Create env files from examples:
```bash
cp .env.example .env
cp .env.testing.example .env.testing
```
2. Start services:
```bash
docker compose up -d --build
```
3. Apply migrations:
```bash
docker compose exec api npx prisma migrate deploy
```
4. Seed first user (optional):
```bash
docker compose exec api npm run db:seed
```
5. Run tests:
```bash
npm run test:integration
```

## Security Defaults

This preset is secure-by-default and env-driven.

- `helmet` enabled
- CORS allowlist via `CORS_ORIGINS` (comma-separated)
- credentials toggle via `CORS_CREDENTIALS`
- request size limits via `JSON_LIMIT` and `URL_ENCODED_LIMIT`
- URL-encoded parameter cap via `URL_ENCODED_PARAMETER_LIMIT`
- `trust proxy` controlled via `TRUST_PROXY`

Adjust these per project/environment.

## Preset Usage Guidelines

Recommended way to use this preset:

1. Keep `/api/v1` as the public API base path.
2. Build features by module (`src/modules/<domain>`).
3. Keep controllers thin, move business logic to services.
4. Keep auth flow as-is (short access token + rotated refresh token).
5. Add migrations for every schema change (never manual DB edits in prod).
6. Add tests for every new route (at least integration happy path + failure path).
7. Keep env-driven config, avoid hardcoded secrets/credentials in code.

## `.env` Recommendations

For local development (`.env`):

- Use local DB URL (`DATABASE_URL`) only.
- Use strong random JWT secrets, even in dev.
- Keep `BCRYPT_SALT_ROUNDS=10` (or 12 for higher security).
- Keep payload limits small (`100kb`) unless your API needs larger bodies.
- Set `CORS_ORIGINS` only to your local frontend origins.
- Set `TRUST_PROXY=false` unless running behind a reverse proxy.

For tests (`.env.testing`):

- Use separate DB (`DATABASE_URL`/`DATABASE_URL_TEST`) from dev DB.
- Use lower `BCRYPT_SALT_ROUNDS` (for example `4`) to speed up tests.
- Keep JWT secrets separate from `.env`.
- Keep `NODE_ENV=test` via scripts (already configured).

For production:

- Generate long random secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Use managed/secured DB connection string.
- Set `TRUST_PROXY=true` when behind load balancer/reverse proxy.
- Set strict `CORS_ORIGINS` to real frontend domains only.
- Keep cookies secure (`Secure`, `HttpOnly`, `SameSite`) and use HTTPS only.

## Start with Docker

```bash
docker compose up --build
```

App will be available at:

- `http://localhost:3000`

## Test Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"server":"up","database":"up","uptimeSeconds":123,"timestamp":"2026-03-20T00:00:00.000Z"}
```

## Prisma Migrations

Run migrations locally:

```bash
npx prisma migrate dev
```

Run migrations in Docker:

```bash
docker compose exec api npx prisma migrate deploy
```

Optional seed:

```bash
docker compose exec api npm run db:seed
```

## Tests

Run all tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Integration tests only:

```bash
npm run test:integration
```

## Stop

```bash
docker compose down
```

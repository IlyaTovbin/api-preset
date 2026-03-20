# Property Management API

Simple Node.js + Express API running in Docker.

## What This Preset Includes

- Versioned API routes under `/api/v1`
- Auth routes under `/api/v1/auth`
- JWT access + refresh flow with refresh token rotation
- Prisma + PostgreSQL
- Security middleware defaults (`helmet`, strict env-driven CORS, payload limits)
- Integration testing with `vitest` + `supertest`
- Separate test env via `.env.testing`

## 1. Configure Environment Files

Create local env files from examples:

```bash
cp .env.example .env
cp .env.testing.example .env.testing
```

Fill the required values in both files.

Minimum required in `.env`:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Minimum required in `.env.testing`:

- `DATABASE_URL`
- `DATABASE_URL_TEST`
- `ADMIN_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## 2. Start Full Environment in Docker

Build and start API + Postgres:

```bash
docker compose up -d --build
```

Apply Prisma migrations inside the API container:

```bash
docker compose exec api npx prisma migrate deploy
```

Optional: seed admin user/data:

```bash
docker compose exec api npm run db:seed
```

API base URL:

- `http://localhost:3000`

## 3. Run Tests

Install dependencies locally (runs Prisma client generation automatically):

```bash
npm install
```

Run integration tests:

```bash
npm run test:integration
```

Other test commands:

```bash
npm test
npm run test:watch
```

## 4. Check Health Endpoint in Postman

1. Open Postman and create a new `GET` request.
2. Use URL: `http://localhost:3000/health`
3. Click **Send**.
4. Confirm status is `200 OK` and response includes:

```json
{
  "server": "up",
  "database": "up",
  "uptimeSeconds": 123,
  "timestamp": "2026-03-20T00:00:00.000Z"
}
```

If DB is unavailable, expected status is `503` with `database: "down"`.

## Useful Commands

Start/rebuild:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f api
```

Stop services:

```bash
docker compose down
```

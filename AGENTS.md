# File Creation Workflow

- If multiple files are needed, propose the file list first.
- Create files one by one.
- Explain each step briefly.
- Before creating each file, ask if I want to create it myself.

# Preset Notes (For Future Agents)

- Treat this repo as an API preset template. Prefer reusable, clean defaults over one-off hacks.
- Keep API versioning under `/api/v1` for all business routes.
- `app.js` exports the Express app; `index.js` only starts the server.
- Health endpoint is `/health` and should reflect both server and DB status.

## Auth Conventions

- Auth routes live under `/api/v1/auth`.
- Current flow uses:
  - access token (JWT, short TTL)
  - refresh token (JWT, rotation enabled)
  - hashed refresh token stored in DB (`refresh_tokens` table)
- Keep auth errors generic (`Invalid credentials`) to avoid user enumeration.
- Keep auth rate limiting enabled on auth routes.

## Env Conventions

- Shared env loader is `env.js` and must be imported (not duplicated with ad-hoc dotenv setup).
- Environment selection:
  - `.env` for normal runtime
  - `.env.testing` for test runtime (`NODE_ENV=test`)
- Required example files:
  - `.env.example`
  - `.env.testing.example`
- Do not hardcode secrets/passwords in code; use env vars only (`ADMIN_PASSWORD`, JWT secrets, etc.).

## Prisma Conventions

- Prisma Client uses adapter mode (`@prisma/adapter-pg` + `pg`).
- Docker image must run `npx prisma generate` during build.
- Use migrations, not manual schema drift.

## Testing Conventions

- Stack: `vitest` + `supertest`.
- Integration tests use dedicated test DB from `DATABASE_URL_TEST`.
- Heavy DB prep runs once in `tests/setup/global-setup.js` (create DB + migrate deploy).
- Per-test cleanup is done in `tests/setup/test-env.js`.
- Keep tests deterministic with factories in `tests/factories`.
- For bcrypt in tests, use low rounds via env (`BCRYPT_SALT_ROUNDS` in `.env.testing`).

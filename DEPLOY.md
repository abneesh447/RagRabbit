# Deploy RagRabbit (Vercel)

## 1. Import the repo

1. Open [Vercel → Add New Project](https://vercel.com/new).
2. Import `abneesh447/RagRabbit`.
3. Set **Root Directory** to `apps/saas` (monorepo).
4. Framework: **Next.js** (auto-detected).

## 2. Postgres (pgvector)

1. In the Vercel project, **Storage → Create → Postgres**.
2. Attach the database to the project.
3. Ensure `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` are set (Vercel does this when linked).

Run pgvector on the database once (Vercel SQL console or local `psql`):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Migrations run on deploy via `vercel-build` (`pnpm db:migrate && next build`).

## 3. Required environment variables

| Variable | Notes |
|----------|--------|
| `OPENAI_API_KEY` | Embeddings + chat |
| `AUTH_SECRET` | `npx auth secret` |
| `AUTH_USERNAME` / `AUTH_PASSWORD` | Admin login (or use OAuth below) |
| `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` | From Vercel Postgres |

Optional: `TRIGGER_SECRET_KEY`, `RESEND_*`, `GITHUB_*`, `GOOGLE_*`, `LLM_MODEL`, `EMBEDDING_MODEL`.

Copy the full list from [apps/saas/.env.example](./apps/saas/.env.example).

Set `AUTH_TRUST_HOST=true` on Vercel (or your production hostname).

## 4. Deploy

Deploy from the Vercel dashboard or:

```bash
npm i -g vercel
cd apps/saas
vercel
```

After the first successful deploy, open:

- App home: `https://<your-project>.vercel.app`
- Widget demo: `https://<your-project>.vercel.app/widget/demo`
- Admin login: `https://<your-project>.vercel.app/login`

Update your README demo link to your real URL if you want a public demo.

## 5. Local development

```bash
pnpm install
pnpm db          # Docker Postgres + pgvector (packages/db scripts)
cd apps/saas && cp .env.example .env.local   # fill values
pnpm dev         # from repo root: pnpm dev (turbo)
```

Demo locally: [http://localhost:3000/widget/demo](http://localhost:3000/widget/demo)
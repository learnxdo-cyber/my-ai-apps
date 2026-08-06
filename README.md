# My AI App

A minimal, production-shaped starter: streaming AI chat built with Next.js
(App Router), the Anthropic SDK, Tailwind, and Prisma + Postgres for chat
history. Deploy-ready for both Vercel and Netlify.

## What's included

- `app/page.tsx` — chat UI (client component), streams tokens as they arrive
- `app/api/chat/route.ts` — API route that calls Claude with streaming and
  persists messages to Postgres via Prisma
- `prisma/schema.prisma` — `User`, `Chat`, `Message` tables
- `lib/prisma.ts` — Prisma client singleton (avoids connection leaks in dev)
- `netlify.toml` — config if you deploy on Netlify instead of Vercel

## 1. Local setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local with your real ANTHROPIC_API_KEY and DATABASE_URL
npx prisma generate
npx prisma db push   # creates the tables in your database
npm run dev
```

Open http://localhost:3000 — you should have a working streaming chat.

## 2. Get the two things you need first

**Anthropic API key**
Go to https://console.anthropic.com → API Keys → Create Key.

**Postgres database** (pick one, both have free tiers)
- Supabase: https://supabase.com/dashboard → New project → Settings →
  Database → copy the "Connection pooling" string for `DATABASE_URL` and
  the "Connection string" (direct) for `DIRECT_URL`.
- Neon: https://neon.tech → New project → copy the pooled connection string
  for `DATABASE_URL` and the direct one for `DIRECT_URL`.

## 3. Deploy on Vercel (recommended)

1. Push this project to a GitHub repo.
2. Go to https://vercel.com/new, sign in with GitHub, import the repo.
3. Vercel auto-detects Next.js — no build settings to change.
4. Add environment variables (Project Settings → Environment Variables):
   `ANTHROPIC_API_KEY`, `DATABASE_URL`, `DIRECT_URL`.
5. Click Deploy. Every push to `main` redeploys automatically.
6. Run migrations against your production DB once:
   `npx prisma db push` (from your machine, pointed at the prod `DATABASE_URL`/`DIRECT_URL`).

## 4. Deploy on Netlify instead

1. Push this project to a GitHub repo (this repo already includes
   `netlify.toml`, so no extra config needed).
2. `npm install -D @netlify/plugin-nextjs` and commit the updated
   `package.json`.
3. Go to https://app.netlify.com → Add new site → Import an existing
   project → select your repo.
4. Add the same environment variables under Site settings → Environment
   variables.
5. Deploy. Note: long streaming responses can hit Netlify Functions'
   duration limits on the free tier — fine for short chats, worth checking
   your plan's limits if replies run long.

## 5. Next steps to make this "advanced"

- Swap the placeholder auth-free API route for real auth (Clerk or Auth.js)
  and scope chats/messages to `userId`.
- Add rate limiting (Upstash Redis) in `app/api/chat/route.ts` before
  calling Anthropic.
- Add a `memories` table + pgvector column for long-term memory / RAG.
- Add tool calling by passing a `tools` array to `anthropic.messages.create`
  and handling `tool_use` blocks in the stream.
- Add file upload (Vercel Blob or Supabase Storage) and pass file content
  into the message context.

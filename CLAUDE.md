# Project context

Personal portfolio for Kevin Chiputra in a newspaper/editorial design. Mobile-first, restrained tactile motion, low resource use, and SEO are priorities.

## Stack

Next.js 16 App Router, React 19, Tailwind CSS 4, CSS motion with a one-shot IntersectionObserver, Supabase Cloud Free, Vercel, npm. Read the installed Next.js guides in `node_modules/next/dist/docs/` before changing framework behavior.

## Architecture

- Public routes `/`, `/about`, `/projects` use shared server-rendered editorial components and tagged one-hour published-content caching.
- `/admin` uses Google OAuth (PKCE/SSR) and a manually bootstrapped UUID allowlist for `chiputrakevin@gmail.com`. Never auto-grant the first visitor access.
- Typed and validated content has independent draft/published JSON snapshots and optimistic revisions. Publishing commits atomically after media promotion and invalidates caches.
- Supabase RLS and checked RPCs protect data. Storage uploads are private, immutable, validated and normalized to WebP before publishing. Runtime does not require a service-role key.
- Auth refresh is in `src/proxy.ts`, limited to admin/auth routes. Private responses must remain no-store and noindex. Every private operation must check authorization independently of layouts/proxy.
- Current content seed and SQL migrations are checked in; seed must never overwrite user edits.
- `PORTFOLIO_DEMO=true` is for isolated tests/demo only. Never silently fall back to seed when a configured live backend fails.
- The public browser bundle must not include the CMS or Supabase SDK. Reduced-motion disables movement; animations have no permanent loops.

## Checks

`npm run lint`, `npm run typecheck`, `npm test`, production build and `npm run test:e2e` against the demo server. Database tests use PGlite; live OAuth needs the real Google account. See README.md for deployment, Google configuration, owner bootstrap, and recovery.

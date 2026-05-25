# Workout Tracker — AGENTS.md

## Stack

- **React Router 7.15** (SSR, file-based routes in `app/routes/`)
- **Vite 8**, **TypeScript** strict with `verbatimModuleSyntax`
- **pnpm** (not npm)
- **Supabase** via `@supabase/ssr` (cookie-based sessions for SSR)
- **shadcn/ui** (style `radix-nova`, non-RSC, aliases at `~/components/ui`)
- **Tailwind CSS 3**, **Zustand**, **Recharts**, **lucide-react**

## Commands

```sh
pnpm dev          # dev server → localhost:5173
pnpm build        # react-router build
pnpm start        # production server
pnpm typecheck    # react-router typegen && tsc
```

No test framework, linter, or formatter is configured.

## Supabase auth (SPA mode)

The app uses `@supabase/supabase-js` directly (no SSR). The supabase client is a singleton created via `createClient()` in `app/lib/supabase.ts`.

Auth is enforced in loaders via `app/lib/auth.ts`:
- `requireAuth()` — redirects to `/auth/login` if unauthenticated
- `requireGuest()` — redirects to `/app` if authenticated

**`requireAuth()` and `requireGuest()` do NOT take a request argument.** They use the browser supabase singleton directly.

## Architecture

- **Repository pattern**: each table has a class extending `BaseRepository`, exported as singleton (`export const xRepository = new XRepository()`). Uses `Result<T>` discriminated union.
- **`~/*` path alias** → `./app/*`. All app imports use `~/` prefix.
- **Error messages** in Spanish (convention).
- **CSS variables** as single source of truth for colors — edit `app/app.css` `:root` block to change palette. `tailwind.config.js` references them via `hsl(var(--...))`.

## Project structure

```
app/
├── routes/          # flat file-based routes (home, app.*, auth.*)
│   ├── app._index.tsx   # dashboard (implemented)
│   ├── auth.login.tsx
│   └── auth.register.tsx
│   └── app.training.tsx, app.routines.tsx, app.progress.tsx, app.profile.tsx  ← empty stubs
├── components/ui/   # shadcn components (radix-nova style)
├── repositories/    # data access classes (7 tables)
├── features/        # auth + dashboard (implemented); profile, progress, routines, training empty
├── core/types/      # common.types.ts, database.types.ts (auto-generated from Supabase)
├── lib/             # supabase.ts, supabase.server.ts, auth.server.ts, utils.ts
└── root.tsx         # root layout + error boundary
```

## Known issues

- **Dockerfile** uses `npm ci` while the project uses pnpm (will fail if `package-lock.json` is absent).
- **`pnpm-workspace.yaml`** has only `allowBuilds` — not a real monorepo.
- **4 route files are empty stubs** (`app.training.tsx`, `app.routines.tsx`, `app.progress.tsx`, `app.profile.tsx`) — they cause typecheck errors due to being empty modules.
- **No test, lint, or format tooling** is installed.

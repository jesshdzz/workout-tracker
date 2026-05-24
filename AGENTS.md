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

## Supabase & SSR auth (critical)

The app uses `@supabase/ssr` for cookie-based sessions. There are two client factories:

- **`app/lib/supabase.ts`** — browser client (`createBrowserClient`). Stores session in cookies. Imported by repositories and auth service for client-side use.
- **`app/lib/supabase.server.ts`** — exports `createServerSupabase(request)` for server loaders/actions. Reads cookies from the `Request` object. Does NOT support setting cookies on responses (no `setAll` handler is needed for read-only auth).

**Never instantiate a Supabase client manually** — always use one of these two.

Server-side auth is enforced in loaders via `app/lib/auth.server.ts`:
```ts
// ❌ Wrong — will fail silently
requireAuth()
// ✅ Correct — pass the request so cookies can be read
requireAuth(request)
```

Both `requireAuth(request)` and `requireGuest(request)` must receive the `request` from the loader's args.

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

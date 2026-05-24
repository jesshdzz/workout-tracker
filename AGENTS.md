# Workout Tracker — AGENTS.md

## Stack

- **React Router 7.15** (SSR, file-based routes in `app/routes/`)
- **Vite 8**, **TypeScript** (strict, `verbatimModuleSyntax`)
- **pnpm** (workspace config in `pnpm-workspace.yaml`)
- **Supabase** (auth + Postgres, typed via `Database` type in `app/core/types/database.types.ts`)
- **shadcn/ui** (style: `radix-nova`, non-RSC, aliases at `~/components/ui`)
- **Tailwind CSS 3**, **Zustand**, **Recharts**, **lucide-react**

## Commands

```sh
pnpm dev          # dev server → localhost:5173
pnpm build        # react-router build
pnpm start        # production server
pnpm typecheck    # react-router typegen && tsc (run this before tsc alone)
```

## Project structure

```
app/
├── routes/          # flat file-based routes (home, app.*, auth.*)
├── components/ui/   # shadcn components (radix-nova style)
├── repositories/    # data access classes (singleton exports)
├── features/        # feature stubs (all empty — scaffolded but unimplemented)
├── core/types/      # common.types.ts, database.types.ts
├── lib/             # supabase client, cn() utility
└── root.tsx         # root layout + error boundary
```

## Architecture & conventions

- **Repository pattern**: each table has a class extending `BaseRepository`, exported as singleton (`export const xRepository = new XRepository()`). Uses `Result<T>` discriminated union for responses.
- **Supabase client** is initialized once in `app/lib/supabase.ts` and imported by repositories — do not instantiate it elsewhere.
- **`~/*` path alias** → `./app/*`. All app imports use `~/` prefix.
- **TypeScript**: `verbatimModuleSyntax` requires `import type` for type-only imports.
- **Error messages** in Spanish (app convention, not a mistake).

## Database tables

`profiles`, `exercises`, `muscle_groups`, `exercise_muscles`, `routines`, `routine_exercises`, `sessions`, `sets`, `personal_records`, `personal_rms`, `user_program_state`

## Known issues

- **`tailwind.config.js`** `content` paths point to `./src/**/*` — should be `./app/**/*` (Tailwind won't scan app files).
- **`.env`** has `VITE_SUPABASE_PUBLISHABLE_KEY` but `app/lib/supabase.ts` reads `VITE_SUPABASE_ANON_KEY` — rename the env var or fix the code.
- **Dockerfile** uses `npm ci` while the project uses pnpm (will fail if `package-lock.json` is absent).
- **No test framework, linter, or formatter is configured**.
- **All route files except `home.tsx` are empty stubs** (feature directories also empty).

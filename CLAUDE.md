# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Vite dev server with HMR
pnpm build        # Type-check (tsc -b) then Vite production build
pnpm lint         # Run ESLint
pnpm preview      # Preview production build locally
```

No test framework is configured yet.

## Architecture

**Stack**: React 19, React Router v7, TanStack Query v5, Tailwind CSS v4, TypeScript 6, Vite 8, i18next (en + uk)

**Entry point**: `src/main.tsx` sets up `QueryClientProvider`, `BrowserRouter`, and `ToastProvider`, then mounts `<App>`. Routes are declared in `src/App.tsx`.

**Folder conventions**:
- `src/routes/` — thin route components; each maps 1:1 to an `APP_ROUTES` entry and renders a view
- `src/views/` — the actual page UI, imported by routes (keeps route files minimal)
- `src/components/` — reusable UI components; each component has an `index.tsx` plus a `variants.ts` for CVA/class-name logic
- `src/api/` — TanStack Query hooks (`useXxxQuery`, `useXxxMutation`) plus bare fetch helpers; co-located by domain
- `src/store/` — plain-object singletons for client-side state that lives outside React (`authStore`, `adminTokenStore`, `toastStore`)
- `src/types/` — TypeScript interfaces mirroring API shapes
- `src/constants/` — `app-routes.ts` (client routes), `api-routes.ts` (backend paths)
- `src/i18n/` — i18next setup; translation files are `src/i18n/locales/en.json` and `uk.json`
- `src/validation/` — Zod schemas for forms

**Path alias**: `@/` resolves to `src/` — use it for all non-relative imports.

## Routing & Auth Guards

Five route guards in `App.tsx` control access:

| Guard | Behavior |
|---|---|
| `RequireAuth` | Redirects to `/login` when no authenticated user |
| `GuestOnly` | Redirects to `/dashboard` when already authenticated |
| `RequireProfileSetupToken` | Requires `profileSetupToken` in sessionStorage; redirects to `/login` otherwise |
| `RequireAdminAuth` | Checks `adminTokenStore.hasSession()`; redirects to `/admin/login` |
| `RequireSuperAdminAuth` | Nested inside `RequireAdminAuth`; additionally checks `isSuperAdmin` |

All user routes are wrapped in `<MainLayout />` (sidebar nav); all admin routes in `<AdminLayout />`.

## Auth Token Model

Two separate auth sessions co-exist:

**User session** (`src/store/authStore.ts`):
- `accessToken` — in-memory only (`_accessToken` module variable)
- `refreshToken` — `localStorage` key `sendit.refreshToken`
- `pendingToken` (2FA mid-flow) — `sessionStorage`
- `profileSetupToken` (post-register profile completion) — `sessionStorage`

**Admin session** (`src/store/adminTokenStore.ts`):
- `accessToken` — in-memory only
- `refreshToken` + session metadata (`isSuperAdmin`, name, email) — `localStorage`
- `pendingToken` / `setupToken` — `sessionStorage`

`apiClient` (`src/api/apiClient.ts`) attaches the user `accessToken` as `Bearer` and auto-retries with `silentRefresh()` on 401. Admin routes use a separate `adminApiClient` with the same pattern.

## API Layer Conventions

- All API modules export TanStack Query hooks; raw `axios` calls go through `apiClient` or `adminApiClient`
- Error handling: `apiClient` uses `validateStatus: () => true` so callers check `res.status` manually; network/timeout errors are caught in an interceptor and surfaced via `toastStore`
- `parseError(res.data)` extracts a string message; `parseApiError(res.data)` returns `{ message, validationDetails }` for validation errors (used with `ApiValidationError`)
- Query keys are exported constants (e.g. `AUTH_QUERY_KEY`, `CURRENT_PLAN_QUERY_KEY`) — always reference these instead of duplicating string arrays

## Key Tooling Details

- **Tailwind v4**: configured via `@tailwindcss/vite`; global styles in `src/styles/index.css` use `@import "tailwindcss"`. No `tailwind.config.*` file.
- **React Compiler**: enabled via `babel-plugin-react-compiler`. Handles memoization automatically — avoid manual `useMemo`/`useCallback` unless there's a specific reason.
- **ESLint**: flat config (`eslint.config.js`), TypeScript-aware, React Hooks plugin enforced.
- **TypeScript**: strict mode with `noUnusedLocals` and `noUnusedParameters` — unused identifiers are compile errors.
- **UI colors**: defined in `src/components/ui.config.ts` — `teal | neutral | info | warning | error | success`. Use `UiColor` type when passing color props.

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

**Stack**: React 19, React Router v7, Tailwind CSS v4, TypeScript 6, Vite 8

**Entry point**: `src/main.tsx` wraps the app in `<BrowserRouter>`. Routes are declared in `src/App.tsx` with React Router's `<Routes>/<Route>`.

**Folder conventions**:
- `src/pages/` — one file per route, consumed by `App.tsx`
- `src/components/` — reusable UI components
- `src/hooks/` — custom React hooks (e.g. `useAuth`, `useBlog`)
- `src/store/` — lightweight state stores (plain objects/hooks, no external library yet)
- `src/utils/` — pure utility functions

**Path alias**: `@/` resolves to `src/` — use it for all non-relative imports.

## Key Tooling Details

- **Tailwind v4**: configured via the `@tailwindcss/vite` Vite plugin; global styles in `src/styles/index.css` use `@import "tailwindcss"`. No `tailwind.config.*` file — Tailwind defaults apply.
- **React Compiler**: enabled via `babel-plugin-react-compiler` through the `rolldown-plugin-babel` Vite plugin. This handles memoization automatically — avoid manual `useMemo`/`useCallback` unless there's a specific reason.
- **ESLint**: flat config format (`eslint.config.js`), TypeScript-aware rules, React Hooks plugin enforced.
- **TypeScript**: strict mode with `noUnusedLocals` and `noUnusedParameters` — unused identifiers are compile errors.

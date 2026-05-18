# Frontend Feature Architecture

New substantial frontend work lives in `src/features/<feature-name>/`, not in legacy component-only folders. Feature folders own their API client, query hooks, route state hooks, and feature-specific components. Other code imports a feature only through its `index.ts` public barrel.

## Folder Shape

```txt
src/features/<feature-name>/
  api/
  hooks/
  components/
  index.ts
```

Shared frontend infrastructure belongs in `src/frontend/`. Generic UI primitives stay in `src/components/ui/`, and cross-feature reusable UI components stay in `src/components/shared/`.

## HTTP Contracts

Frontend API clients import response types from colocated API `responses.ts` files. Components and hooks must never import from `route.ts` or from `src/modules/**`.

Allowed flow:

```txt
src/modules/<module>/application presenters
  -> src/app/api/**/responses.ts
  -> src/features/<feature>/api/*-api.ts
  -> src/features/<feature>/hooks/*
  -> src/features/<feature>/components/*
```

`responses.ts` files must stay frontend-import-safe: no Next runtime imports, Supabase clients, module container imports, auth request context, or infrastructure imports.

## Server State

TanStack Query owns data loaded from the backend, mutation state, invalidation, refetching, and optimistic updates. React local state owns UI-only state such as form drafts, inline edit IDs, modal open state, copied indicators, and selected local control values.

Do not copy query data into local state unless it is intentionally becoming an editable draft.

## Routing

Route-driven features should use real route segments. The Feedback Notes pilot supports:

```txt
/feedback-notes
/feedback-notes/[feedbackId]
/feedback-notes/[feedbackId]?status=active|closed|all
```

The `feedbackId` path segment controls the detail resource. The `status` query param controls only the sidebar list. Selecting the first loaded note automatically should use `router.replace`; user selection should use `router.push`.

## Verification

Run `npm run build` after changes under `src/app`, `src/components`, `src/features`, or `src/frontend`. Run `npm run ddd:check` when architecture boundaries may be affected. `scripts/verify-frontend-boundaries.mjs` currently enforces migrated frontend roots (`src/features` and `src/frontend`) plus unsafe `responses.ts` imports; legacy `src/components/<module-name>` screens should be migrated into feature folders before being brought under the stricter check.

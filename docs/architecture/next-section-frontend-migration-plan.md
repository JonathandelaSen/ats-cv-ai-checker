# Next App Section Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the next legacy app section from `src/components/<section>/` and shell `activeView` state into a route-driven `src/features/<section>/` feature using the same architecture proven by Feedback Notes.

**Architecture:** The migrated section gets real App Router routes under `src/app/<section>/`, a persistent section layout that keeps `AppShell` mounted across detail navigation, explicit HTTP `responses.ts` contracts, a frontend-only API client, TanStack Query hooks for server state, and local state colocated with the UI interactions that own it. Intra-feature item/tab navigation must update the URL immediately with History API when the destination is already handled entirely by the client feature, so slow RSC payloads do not make clicks feel ignored.

**Tech Stack:** Next.js App Router, React client components, TanStack Query, TypeScript, existing shadcn/ui primitives where useful, existing `AppShell` sidebar, HTTP route helpers from `@/modules/shared`, and DDD module barrels for API route serialization only.

---

## Important Lessons From Feedback Notes

The Feedback Notes migration established the target pattern and exposed several traps that this plan intentionally avoids:

- Do not render `AppShell` separately from both `/section` and `/section/[id]` pages. That remounts the shell on detail navigation and repeats global API calls such as `/api/admin/me`, `/api/job-match-analyses`, and `/api/cv-analyses`.
- Put `AppShell initialView="<section>"` in `src/app/<section>/layout.tsx` so the shell persists while nested routes change.
- Pages under the section may return `null` when the feature content is rendered by `AppShell`.
- Do not use `router.push` for high-frequency intra-feature detail/tab changes when the feature already owns the client state and loaders. With slow network, App Router waits for the RSC payload before `useParams` updates, making the UI feel stuck.
- Use `window.history.pushState` and `window.history.replaceState` for immediate in-feature URL changes, then read current route state from `usePathname()` and `useSearchParams()`.
- Keep `router.push` for leaving the feature or entering a different app section.
- Remember the last visited feature URL in `AppShell` before leaving the section, so returning from the global sidebar restores the same item/tab rather than falling back to the first item.
- Frontend files in `src/features/**` must not import from `@/modules/**` or API `route.ts` files. They may import response types from API `responses.ts`.

## Pre-Migration Decisions

Before editing code, pick the concrete target section and write the decision into this plan or a short implementation note:

- Section label in sidebar, for example `Interview Questions`, `Received Feedback`, `Objectives`, `Work Journal`, `CV Library`, or another legacy section.
- Route segment, for example `/interview-questions`.
- Primary detail resource, for example `/interview-questions/[questionId]`.
- Query params for list state, for example `status=active|closed|all`, `cv=<cvId>`, `tab=...`, or none.
- Existing legacy entry point in `src/components/<legacy-section>/`.
- Existing API routes consumed by the section.
- Whether the section has backend mutations and therefore needs observability checks.
- Whether the section uses AI prompts, model input shape, or prompt copy flows and therefore requires prompt docs under `docs/prompts/<prompt-type>/prompt.md`.

Use this route contract style:

```txt
/<section>
/<section>/<resourceId>
/<section>/<resourceId>?<list-or-tab-query>=<value>
```

If the section does not have a detail resource, use:

```txt
/<section>
/<section>?<tab-or-filter-query>=<value>
```

### Current Migration Decision: Objectives

```txt
Section label: Objectives
Route segment: /objectives
Primary detail resource: commitment objective, via /objectives/[objectiveId]
Query params: none
Existing legacy entry point: src/components/commitments/
Existing API routes: /api/commitments, /api/commitments/[id], /api/commitments/[id]/items, /api/commitments/[id]/outcomes, /api/commitments/items/[id], /api/commitments/outcomes/[id], /api/commitments/contexts, /api/commitments/contexts/[id]
Backend mutations: yes; verify the commitments module use cases record platform actions for create, update, delete, item, outcome, and context changes
AI prompt impact: none found in the legacy objectives UI; no prompt docs update is expected unless the migration changes model input, prompt copy, or generated content behavior
Server state owned by TanStack Query: commitments workspace, commitment contexts, selected objective detail, objective items, and outcomes
Local UI state owned by React: selected objective draft fields, search/filter controls, inline edit ids, create-context fields, saving/error indicators, and delete confirmation state
Why this section next: Work Journal is already under src/features/work-journal and src/app/work-journal. Objectives is the smallest remaining legacy job-section candidate: a single legacy component folder with no AI prompt flow and no CV editor/template surface area.
```

## Target File Structure

Create this feature structure, replacing `<section>` with the concrete kebab-case route/feature name:

```txt
src/features/<section>/
  api/
    <section>-api.ts
    <section>-query-keys.ts
  hooks/
    use-<section>-route-state.ts
    use-<section>-queries.ts
    use-<section>-mutations.ts
  components/
    <section>-view.tsx
    <section>-sidebar.tsx
    <section>-detail.tsx
    <section>-list-item.tsx
    <interaction-specific-panel>.tsx
    <section>-skeleton.tsx
  index.ts
```

Create App Router files:

```txt
src/app/<section>/layout.tsx
src/app/<section>/page.tsx
src/app/<section>/[resourceId]/page.tsx
```

For every frontend-consumed API route, add:

```txt
src/app/api/<route>/responses.ts
```

## Task 1: Inventory The Legacy Section

**Files:**
- Read: `src/components/shell/app-shell.tsx`
- Read: `src/components/shell/sidebar.tsx`
- Read: the current section component folder under `src/components/<legacy-section>/`
- Read: `src/app/api/**/route.ts` files called by the legacy section
- Read: `src/modules/<owning-module>/index.ts` and presenters if API routes serialize module output

- [ ] **Step 1: Find the shell view key**

Run:

```bash
rg "\"<section-view-key>\"|onOpen.*<Section>|activeView" src/components/shell -n
```

Expected: identify the `AppView` union member, sidebar handler prop, and the `activeView === "<section-view-key>"` render branch.

- [ ] **Step 2: Find direct frontend API calls**

Run:

```bash
rg "fetch\\(\"/api|fetch\\(`/api" src/components/<legacy-section> src/components/shell -n
```

Expected: list every endpoint, method, request body, response shape, and error handling path used by the section.

- [ ] **Step 3: Find module imports that must leave frontend code**

Run:

```bash
rg "@/modules/|src/modules/" src/components/<legacy-section> -n
```

Expected: every module type/prompt/presenter import is either moved behind API `responses.ts`, duplicated as frontend-safe response types, or intentionally replaced by a frontend-local helper.

- [ ] **Step 4: Map local vs server state**

Write a short table in the implementation notes:

```txt
Server state owned by TanStack Query:
- list data
- detail data
- related child collections
- mutation results

Local UI state owned by React:
- draft form text
- selected local control values
- modal open/closed state
- copied/saving indicators
- inline edit id
```

Expected: no `useQuery().data` is copied into `useState` unless it becomes an editable draft.

## Task 2: Add API Response Contracts

**Files:**
- Create: `src/app/api/<route>/responses.ts` for every endpoint consumed by the feature
- Modify: `src/app/api/<route>/route.ts`
- Modify: route-local `validation.ts` only when the frontend contract moves from snake_case to camelCase request bodies

- [ ] **Step 1: Create response type files**

For list/detail endpoints, use this shape:

```ts
export interface <Entity>Response {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface <Entity>PresenterOutput {
  id: string;
  created_at: string;
  updated_at: string;
}

export type List<Entities>Response = <Entity>Response[];
export type Get<Entity>Response = <Entity>Response;

export function to<Entity>Response(input: <Entity>PresenterOutput): <Entity>Response {
  return {
    id: input.id,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}
```

Expected: response contracts are camelCase and contain only serialized HTTP data.

- [ ] **Step 2: Keep `responses.ts` frontend-safe**

Do not import any of these from `responses.ts`:

```txt
next/server
server-only
@supabase/*
@/lib/container
@/app/api/_shared/auth/request-context
@/modules/<module>/infrastructure/*
```

Expected: `node scripts/verify-frontend-boundaries.mjs` passes after the feature is wired.

- [ ] **Step 3: Update route handlers to return response contracts**

Use this pattern inside `route.ts`:

```ts
import { to<Entity>Response, type Get<Entity>Response } from "./responses";

return ok(
  to<Entity>Response(present<Entity>(entity)) satisfies Get<Entity>Response
);
```

For delete endpoints:

```ts
export interface Delete<Entity>Response {
  ok: true;
}

return ok({ ok: true } satisfies Delete<Entity>Response);
```

Expected: frontend code imports only from `responses.ts`, never from `route.ts` or modules.

- [ ] **Step 4: Accept camelCase request bodies where the migrated frontend sends them**

Update route validation like this when needed:

```ts
const personName = normalizeRequiredText(body.personName ?? body.person_name);
const finalFeedback = normalizeOptionalText(body.finalFeedback ?? body.final_feedback);
```

Expected: existing snake_case callers keep working while the migrated feature sends camelCase.

## Task 3: Create The Feature API Client

**Files:**
- Create: `src/features/<section>/api/<section>-api.ts`
- Create: `src/features/<section>/api/<section>-query-keys.ts`

- [ ] **Step 1: Add query keys**

Use stable, typed keys:

```ts
export const <sectionCamel>QueryKeys = {
  all: ["<section>"] as const,
  lists: () => [...<sectionCamel>QueryKeys.all, "list"] as const,
  list: (filter: string) => [...<sectionCamel>QueryKeys.lists(), filter] as const,
  details: () => [...<sectionCamel>QueryKeys.all, "detail"] as const,
  detail: (id: string | null) => [...<sectionCamel>QueryKeys.details(), id] as const,
};
```

Expected: every query and mutation invalidation uses this file.

- [ ] **Step 2: Add a frontend-only API client**

Use this pattern:

```ts
import type { List<Entities>Response } from "@/app/api/<route>/responses";

async function readJsonResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

export async function list<Entities>() {
  const res = await fetch("/api/<route>");
  return readJsonResponse<List<Entities>Response>(
    res,
    "Could not load <entities>."
  );
}
```

Expected: this file imports no React, no TanStack Query, and no modules.

- [ ] **Step 3: Add semantic type aliases only when helpful**

Use response-derived aliases:

```ts
export type <Entity>ListItem = List<Entities>Response[number];
```

Expected: no 1:1 view-model mappers unless the UI truly needs a different shape.

## Task 4: Create Query And Mutation Hooks

**Files:**
- Create: `src/features/<section>/hooks/use-<section>-queries.ts`
- Create: `src/features/<section>/hooks/use-<section>-mutations.ts`

- [ ] **Step 1: Wrap read queries**

Use this pattern:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { get<Entity>, list<Entities> } from "../api/<section>-api";
import { <sectionCamel>QueryKeys } from "../api/<section>-query-keys";

export function use<Entities>List(filter: string) {
  return useQuery({
    queryKey: <sectionCamel>QueryKeys.list(filter),
    queryFn: () => list<Entities>(filter),
  });
}

export function use<Entity>Detail(id: string | null) {
  return useQuery({
    queryKey: <sectionCamel>QueryKeys.detail(id),
    queryFn: () => get<Entity>(id as string),
    enabled: Boolean(id),
  });
}
```

Expected: no direct fetch calls remain in React components.

- [ ] **Step 2: Wrap mutations and invalidation**

Use this pattern:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create<Entity>, update<Entity>, delete<Entity> } from "../api/<section>-api";
import { <sectionCamel>QueryKeys } from "../api/<section>-query-keys";

export function use<Section>Mutations() {
  const queryClient = useQueryClient();

  const invalidate<Entity> = async (id?: string | null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: <sectionCamel>QueryKeys.lists() }),
      id
        ? queryClient.invalidateQueries({ queryKey: <sectionCamel>QueryKeys.detail(id) })
        : Promise.resolve(),
    ]);
  };

  return {
    create<Entity>: useMutation({
      mutationFn: create<Entity>,
      onSuccess: async (entity) => {
        queryClient.setQueryData(<sectionCamel>QueryKeys.detail(entity.id), entity);
        await invalidate<Entity>(entity.id);
      },
    }),
    update<Entity>: useMutation({
      mutationFn: update<Entity>,
      onSuccess: async (entity) => {
        queryClient.setQueryData(<sectionCamel>QueryKeys.detail(entity.id), entity);
        await invalidate<Entity>(entity.id);
      },
    }),
    delete<Entity>: useMutation({
      mutationFn: delete<Entity>,
      onSuccess: async (_result, id) => {
        queryClient.removeQueries({ queryKey: <sectionCamel>QueryKeys.detail(id) });
        await invalidate<Entity>(null);
      },
    }),
  };
}
```

Expected: mutations update caches intentionally and invalidate affected lists/details.

## Task 5: Implement Immediate Route State

**Files:**
- Create: `src/features/<section>/hooks/use-<section>-route-state.ts`

- [ ] **Step 1: Parse route state from pathname and search params**

Use this pattern for detail-resource sections:

```ts
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

function normalizeTab(value: string | null) {
  return value === "closed" || value === "all" ? value : "active";
}

export function use<Section>RouteState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = normalizeTab(searchParams.get("status"));
  const resourceId = pathname.startsWith("/<section>/")
    ? decodeURIComponent(pathname.slice("/<section>/".length).split("/")[0] ?? "") || null
    : null;

  const hrefFor = useCallback(
    (nextResourceId: string | null, nextTab = tab) => {
      const query = new URLSearchParams({ status: nextTab });
      return nextResourceId
        ? `/<section>/${encodeURIComponent(nextResourceId)}?${query.toString()}`
        : `/<section>?${query.toString()}`;
    },
    [tab]
  );

  const setTab = useCallback(
    (nextTab: string) => {
      window.history.pushState(null, "", hrefFor(resourceId, nextTab));
    },
    [hrefFor, resourceId]
  );

  const selectResource = useCallback(
    (nextResourceId: string) => {
      window.history.pushState(null, "", hrefFor(nextResourceId));
    },
    [hrefFor]
  );

  const replaceResource = useCallback(
    (nextResourceId: string) => {
      window.history.replaceState(null, "", hrefFor(nextResourceId));
    },
    [hrefFor]
  );

  const clearSelection = useCallback(() => {
    window.history.replaceState(null, "", hrefFor(null));
  }, [hrefFor]);

  return {
    resourceId,
    tab,
    pathname,
    setTab,
    selectResource,
    replaceResource,
    clearSelection,
  };
}
```

Expected: clicking list items and tabs changes the selected state immediately even under 3G throttling.

- [ ] **Step 2: Use `router.push` only for leaving the feature**

Use `router.push` in `AppShell` for global sidebar navigation. Do not use it for list selection, tab changes, or detail selection inside the feature when the feature already owns its loaders.

Expected: no `?_rsc=...` delay is visible for high-frequency in-feature interactions.

## Task 6: Create Real Routes With Persistent Layout

**Files:**
- Create: `src/app/<section>/layout.tsx`
- Create: `src/app/<section>/page.tsx`
- Create: `src/app/<section>/[resourceId]/page.tsx` when the section has detail routes

- [ ] **Step 1: Create a persistent section layout**

Use this exact shape:

```tsx
import type { ReactNode } from "react";
import AppShell from "@/components/shell/app-shell";

export default function <Section>Layout({
  children: _children,
}: {
  children: ReactNode;
}) {
  return <AppShell initialView="<section-view-key>" />;
}
```

Expected: navigating between `/section/<id>` routes does not remount `AppShell`.

- [ ] **Step 2: Create route pages**

Use this shape:

```tsx
export default function <Section>Page() {
  return null;
}
```

And for detail:

```tsx
export default function <Section>DetailPage() {
  return null;
}
```

Expected: the pages exist for shareable URLs, while `AppShell` renders the section feature.

## Task 7: Move And Split Components

**Files:**
- Create: `src/features/<section>/components/<section>-view.tsx`
- Create: `src/features/<section>/components/<section>-sidebar.tsx`
- Create: `src/features/<section>/components/<section>-detail.tsx`
- Create: `src/features/<section>/components/<section>-list-item.tsx`
- Create: focused panel components for child collections, forms, generated content, or settings
- Create or move: `src/features/<section>/components/<section>-skeleton.tsx`
- Create: `src/features/<section>/index.ts`
- Delete after imports move: `src/components/<legacy-section>/`

- [ ] **Step 1: Build the composition component**

`<section>-view.tsx` owns route state, query hooks, mutation hooks, and top-level error display:

```tsx
"use client";

export default function <Section>View() {
  const routeState = use<Section>RouteState();
  const listQuery = use<Entities>List(routeState.tab);
  const detailQuery = use<Entity>Detail(routeState.resourceId);
  const mutations = use<Section>Mutations();

  const items = listQuery.data ?? [];
  const selectedFromList =
    items.find((item) => item.id === routeState.resourceId) ?? null;
  const selected = detailQuery.data ?? selectedFromList;

  return (
    <div className="flex h-full min-h-0 bg-[#09090f] text-zinc-100">
      <<Section>Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {selected ? <<Section>Detail /> : <EmptyState />}
      </main>
    </div>
  );
}
```

Expected: child components receive explicit props and do not call `fetch`.

- [ ] **Step 2: Auto-select the first item only when no resource is in the URL**

Use this pattern:

```tsx
useEffect(() => {
  if (!resourceId && items[0]?.id) {
    replaceResource(items[0].id);
  }
}, [items, replaceResource, resourceId]);
```

Expected: returning to a remembered `/section/<id>` URL does not jump to the first list item.

- [ ] **Step 3: Keep local draft state close to the owner**

Examples:

```txt
Search input draft -> sidebar component
Inline edit draft -> list item or panel component
Detail form draft -> detail component
Modal open state -> parent that opens the modal
Copied indicator -> button/panel that owns copy action
```

Expected: query data is not mirrored into local state except editable drafts.

- [ ] **Step 4: Export only the public feature entry point**

Use:

```ts
export { default as <Section>View } from "./components/<section>-view";
```

Expected: `AppShell` imports from `@/features/<section>`, not deep component paths.

## Task 8: Update AppShell And Sidebar

**Files:**
- Modify: `src/components/shell/app-shell.tsx`
- Modify: `src/components/shell/sidebar.tsx`

- [ ] **Step 1: Import the feature through its barrel**

Use:

```ts
import { <Section>View } from "@/features/<section>";
```

Expected: no import from `@/components/<legacy-section>`.

- [ ] **Step 2: Add last-location memory for the migrated section**

Use the Feedback Notes pattern:

```ts
const last<Section>HrefRef = useRef("/<section>");

const remember<Section>Location = useCallback(() => {
  if (window.location.pathname.startsWith("/<section>")) {
    last<Section>HrefRef.current = `${window.location.pathname}${window.location.search}`;
  }
}, []);
```

Call `remember<Section>Location()` at the start of every handler that leaves this section:

```ts
const handleOpenCVs = () => {
  remember<Section>Location();
  setActiveView("cvs");
  window.history.replaceState(null, "", "/?view=cvs");
};
```

Expected: leaving and returning restores the exact previous item/tab URL.

- [ ] **Step 3: Update the sidebar handler**

Use:

```ts
const handleOpen<Section> = () => {
  setActiveView("<section-view-key>");
  setActiveAnalysisId(null);
  setActiveAnalysis(null);
  router.push(last<Section>HrefRef.current);
};
```

Expected: sidebar return does not force `/section` and does not auto-select the first item unless the user has never visited the section.

- [ ] **Step 4: Redirect legacy query URL**

If the old entry point was `/?view=<section-view-key>`, update the route-reading effect:

```ts
} else if (view === "<section-view-key>") {
  queueMicrotask(() => {
    router.replace("/<section>");
  });
} else if (window.location.pathname.startsWith("/<section>")) {
  queueMicrotask(() => {
    setActiveView("<section-view-key>");
    setActiveAnalysisId(null);
    setActiveAnalysis(null);
  });
}
```

Expected: old URLs still land in the new route segment.

## Task 9: Remove Legacy Frontend Imports

**Files:**
- Delete: `src/components/<legacy-section>/` after all imports move
- Modify: any importer still referencing the legacy folder

- [ ] **Step 1: Search for legacy imports**

Run:

```bash
rg "components/<legacy-section>|@/components/<legacy-section>|<legacy-section>/" src -n
```

Expected: no references remain except intentionally deleted files in git diff.

- [ ] **Step 2: Search for forbidden feature imports**

Run:

```bash
rg "@/modules/|src/modules/|/route" src/features/<section> -n
```

Expected: no module imports and no API route imports in the feature.

## Task 10: Update Architecture Checks

**Files:**
- Modify: `scripts/verify-frontend-boundaries.mjs` if the new migration expands enforcement
- Modify: `docs/architecture/frontend-feature-architecture.md` if the pattern changes

- [ ] **Step 1: Ensure the migrated feature is covered**

Run:

```bash
node scripts/verify-frontend-boundaries.mjs
```

Expected: no boundary violations from `src/features/<section>`.

- [ ] **Step 2: Decide whether to include more legacy roots**

If the migrated section removes the last `@/modules/**` imports from a legacy `src/components/<area>`, update the verifier to include that root. Do not add all `src/components/**` until remaining legacy screens are migrated or cleaned up.

Expected: checker becomes stricter only where the codebase is ready to pass.

## Task 11: Update Prompt Documentation If Needed

**Files:**
- Modify or create: `docs/prompts/<prompt-type>/prompt.md`
- Read: `src/modules/<module>/domain/services/*prompts.ts`
- Read: `src/modules/<module>/infrastructure/services/gemini-*.service.ts`

- [ ] **Step 1: Identify prompt impact**

If the migrated section changes any of these, update prompt docs in the same change:

```txt
prompt text
prompt builder
model input data
response shape
copy-prompt behavior
controller behavior around model calls
```

Expected: prompt docs include current prompt, source file path, data flow, runtime flow, and maintenance notes.

- [ ] **Step 2: Keep prompts and controllers separate**

Prompt builders stay in prompt-only modules. SDK client calls stay in service/controller files that import prompt builders.

Expected: no inline prompt text inside SDK-call/controller files.

## Task 12: Verify Behavior Under Slow Network

**Files:**
- No code files unless verification reveals a bug

- [ ] **Step 1: Build**

Run:

```bash
npm run build
```

Expected: build passes and Next route list includes `/<section>` and any detail route.

- [ ] **Step 2: Architecture checks**

Run:

```bash
npm run ddd:check
```

Expected: DDD checks and frontend boundary checks pass.

- [ ] **Step 3: Browser manual verification**

With DevTools Network throttled to 3G:

```txt
1. Open /<section>.
2. Click a list item.
3. Confirm selected visual state and URL change immediately.
4. Confirm detail area shows loader or cached shell immediately.
5. Confirm data fills in when API response returns.
6. Click another tab/filter.
7. Confirm tab selected state changes immediately.
8. Leave via global sidebar.
9. Return via global sidebar.
10. Confirm the exact previous /<section>/<id>?query URL is restored.
```

Expected: no visible “click ignored” delay and no jump to the first item unless the URL intentionally has no selected resource.

- [ ] **Step 4: Network sanity check**

When clicking inside the feature, expected network calls are only:

```txt
/api/<section-specific-list-or-detail>
/api/<section-specific-child-collection>
```

Unexpected calls:

```txt
/api/admin/me
/api/cv-analyses
/api/job-match-analyses
```

Expected: global shell API calls do not repeat when switching detail resources inside the section.

## Completion Checklist

- [ ] The section has real routes under `src/app/<section>/`.
- [ ] `AppShell` persists via `src/app/<section>/layout.tsx`.
- [ ] The feature lives under `src/features/<section>/`.
- [ ] API responses have `responses.ts` contracts.
- [ ] Frontend code imports response types from `responses.ts`, never `route.ts`.
- [ ] Frontend code does not import from `@/modules/**`.
- [ ] TanStack Query owns server state.
- [ ] Local drafts stay local.
- [ ] Intra-feature item/tab clicks update URL and UI immediately with History API.
- [ ] Sidebar return restores the last section URL.
- [ ] Legacy `src/components/<legacy-section>/` files are removed or reduced to a temporary shim that is deleted before completion.
- [ ] `npm run ddd:check` passes.
- [ ] `npm run build` passes.

## Suggested Commit Breakdown

Do not commit automatically. If the user asks for commits, use this sequence:

```txt
1. feat(<section>): add API response contracts
2. feat(<section>): add feature API and query hooks
3. feat(<section>): move UI into feature components
4. feat(<section>): add route-driven shell integration
5. test(<section>): add or update frontend boundary verification
6. docs(<section>): document migration and prompt changes
```

Keep production Supabase migrations out of scope unless the user explicitly asks for them in the same turn.

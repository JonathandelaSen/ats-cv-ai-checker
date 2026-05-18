# Contexts Module Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the partial Activity Context migration by promoting shared user contexts into a correctly named canonical `contexts` module and making Work Journal, Commitments, and Received Feedback reference contexts by ID.

**Architecture:** Rename the current `activity` module to `contexts` as the canonical owner of context lifecycle, validation, default context behavior, assignment counting, and reassignment. Feature modules keep their own aggregates but store only context IDs; they must not own context entities, context repositories, or context lifecycle use cases. API routes that manage contexts move to `/api/contexts`, while legacy feature-specific context routes are removed or turned into temporary frontend compatibility shims only if required by existing UI during a phased cutover.

**Tech Stack:** Next.js App Router route handlers, Supabase, TypeScript, DDD modules under `src/modules`, colocated Vitest backend tests, `npm run test:backend`, `npm run ddd:check`, `npm run build`.

---

## Current State

- Canonical data already exists in `public.activity_contexts`.
- `src/modules/activity` already contains the intended canonical module, but the name is wrong for the desired architecture.
- `docs/adr/0001-activity-contexts-own-shared-user-spheres.md` says shared contexts are owned by Activity Contexts.
- `work_journal_entries`, `commitments`, and `received_feedback` already store `activity_context_id`.
- `src/modules/work-journal` still owns `WorkJournalContext`, context VOs, context errors, context repository, and context use cases.
- `src/modules/commitments` still owns `CommitmentContext`, context repository, and context use cases.
- `src/app/api/activity-contexts` exists, plus legacy feature routes under `src/app/api/work-journal/contexts` and `src/app/api/commitments/contexts`.

## Target State

- Module name is `src/modules/contexts`.
- Container exports `contextsModule`.
- API route is `src/app/api/contexts`.
- Database table can remain `activity_contexts` initially to avoid a risky DB rename; repository naming hides this implementation detail. A later DB cleanup can rename the table if desired.
- Feature modules only reference context IDs using shared `EntityId` or a small local alias where useful.
- Work Journal entry and Commitment aggregate fields are named `contextId` at the domain boundary, but repositories map them to DB `activity_context_id`.
- Context lifecycle actions are owned by `contextsModule`.
- No feature module exports or imports `WorkJournalContext` or `CommitmentContext`.
- Frontend consumers import response contracts from API `responses.ts`, not from module internals.

## File Structure

### Create or Rename

- Rename directory: `src/modules/activity` -> `src/modules/contexts`.
- Rename module file: `src/modules/contexts/activity-contexts.module.ts` -> `src/modules/contexts/contexts.module.ts`.
- Rename entity: `src/modules/contexts/domain/entities/activity-context.entity.ts` -> `src/modules/contexts/domain/entities/context.entity.ts`.
- Rename repository port: `src/modules/contexts/domain/repositories/activity-context.repository.ts` -> `src/modules/contexts/domain/repositories/context.repository.ts`.
- Rename repository implementation: `src/modules/contexts/infrastructure/repositories/supabase-activity-context.repository.ts` -> `src/modules/contexts/infrastructure/repositories/supabase-context.repository.ts`.
- Rename use cases from `*-activity-context*.use-case.ts` to `*-context*.use-case.ts`.
- Rename route directory: `src/app/api/activity-contexts` -> `src/app/api/contexts`.
- Create migration cleanup file under `supabase/migrations/<timestamp>_drop_legacy_feature_context_tables.sql` only after code no longer uses legacy tables.
- Update ADR: `docs/adr/0001-activity-contexts-own-shared-user-spheres.md` to reflect canonical `contexts` naming.

### Modify

- `src/lib/container.ts`: replace `activityContextsModule` with `contextsModule`.
- `src/modules/work-journal/work-journal.module.ts`: remove context repo/use cases from module factory after entry flows depend on contexts module or a minimal context lookup port.
- `src/modules/work-journal/domain/entities/journal-entry.entity.ts`: keep only context ID association, preferably using shared `EntityId`.
- `src/modules/work-journal/domain/repositories/work-journal-entry.repository.ts`: criteria use context ID only.
- `src/modules/work-journal/infrastructure/repositories/supabase-work-journal-entry.repository.ts`: continue mapping domain `contextId` to DB `activity_context_id`.
- `src/modules/commitments/commitments.module.ts`: remove context repo/use cases from module factory.
- `src/modules/commitments/domain/entities/commitment.entity.ts`: keep only context ID association.
- `src/modules/commitments/infrastructure/repositories/supabase-commitment.repository.ts`: continue mapping domain `contextId` to DB `activity_context_id`.
- `src/app/api/work-journal/entries/**`: bind both `workJournalModule` and `contextsModule` if controller validates context existence before entry creation/update/draft.
- `src/app/api/commitments/**`: bind both `commitmentsModule` and `contextsModule` if controller validates context existence before commitment creation/update.
- Frontend feature API clients using `/api/activity-contexts`, `/api/work-journal/contexts`, or `/api/commitments/contexts`: switch to `/api/contexts`.

### Delete When Unused

- `src/modules/work-journal/domain/entities/journal-context.entity.ts`
- `src/modules/work-journal/domain/entities/journal-context.entity.test.ts`
- `src/modules/work-journal/domain/repositories/work-journal-context.repository.ts`
- `src/modules/work-journal/domain/errors/context-not-found.error.ts`
- `src/modules/work-journal/domain/errors/context-archived.error.ts`
- `src/modules/work-journal/domain/events/work-journal-context-created.event.ts`
- `src/modules/work-journal/domain/events/work-journal-context-updated.event.ts`
- `src/modules/work-journal/domain/value-objects/work-journal-context-*.ts`
- `src/modules/work-journal/domain/value-objects/work-journal-is-default.value-object.ts`
- `src/modules/work-journal/domain/value-objects/work-journal-role-or-label.value-object.ts` if no longer used elsewhere.
- `src/modules/work-journal/domain/value-objects/work-journal-created-from-cv.value-object.ts` if no longer used elsewhere.
- `src/modules/work-journal/infrastructure/repositories/supabase-work-journal-context.repository.ts`
- `src/modules/work-journal/infrastructure/repositories/supabase-work-journal-context.repository.test.ts`
- `src/modules/work-journal/application/use-cases/create-context.use-case.ts`
- `src/modules/work-journal/application/use-cases/update-context.use-case.ts`
- `src/modules/work-journal/application/use-cases/list-contexts.use-case.ts`
- `src/modules/work-journal/application/use-cases/ensure-default-context.use-case.ts`
- `src/modules/work-journal/application/use-cases/list-context-suggestions.use-case.ts`
- `src/modules/work-journal/application/use-cases/handle-suggestion-action.use-case.ts`
- Matching tests for those use cases, unless suggestion behavior is migrated into `contexts`.
- `src/modules/commitments/domain/entities/commitment-context.entity.ts`
- `src/modules/commitments/domain/entities/commitment-context.entity.test.ts`
- `src/modules/commitments/domain/repositories/commitment-context.repository.ts`
- `src/modules/commitments/domain/errors/commitment-context-not-found.error.ts`
- `src/modules/commitments/infrastructure/repositories/supabase-commitment-context.repository.ts`
- `src/modules/commitments/infrastructure/repositories/supabase-commitment-context.repository.test.ts`
- `src/modules/commitments/application/use-cases/create-context.use-case.ts`
- `src/modules/commitments/application/use-cases/update-context.use-case.ts`
- `src/modules/commitments/application/use-cases/ensure-default-context.use-case.ts`
- Matching tests for those use cases.
- `src/app/api/activity-contexts/**` after route is moved.
- `src/app/api/work-journal/contexts/**` and `src/app/api/commitments/contexts/**` after frontend cutover.

---

## Task 1: Rename Canonical Module from Activity to Contexts

**Files:**
- Move: `src/modules/activity` -> `src/modules/contexts`
- Move: `src/modules/contexts/activity-contexts.module.ts` -> `src/modules/contexts/contexts.module.ts`
- Modify: `src/modules/contexts/index.ts`
- Modify: `src/lib/container.ts`
- Modify: all imports of `@/modules/activity`

- [ ] **Step 1: Move files without changing behavior**

Run:

```bash
mv src/modules/activity src/modules/contexts
mv src/modules/contexts/activity-contexts.module.ts src/modules/contexts/contexts.module.ts
```

- [ ] **Step 2: Rename exports in `src/modules/contexts/contexts.module.ts`**

Replace `ActivityContextsModule` and `createActivityContextsModule` with `ContextsModule` and `createContextsModule`. Keep the use case names for this step if needed; this task is a behavior-preserving module rename.

Expected shape:

```ts
export type ContextsModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): ContextsModule;
};

export function createContextsModule(): ContextsModule {
  const useCases = createUseCases();

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      activityContextRepo.bindRequest(client);
      return this;
    },
  };
}
```

- [ ] **Step 3: Update `src/modules/contexts/index.ts`**

Expected exports:

```ts
export { createContextsModule } from "./contexts.module";
export { presentActivityContext as presentContext } from "./application/presenters/activity-context-presenters";
export type {
  ActivityContextPrimitives as ContextPrimitives,
  ActivityContextStatus as ContextStatus,
  ActivityContextType as ContextType,
} from "./domain/entities/activity-context.entity";
```

- [ ] **Step 4: Update container**

Change:

```ts
import { createActivityContextsModule } from "@/modules/activity";
export const activityContextsModule = createActivityContextsModule();
```

to:

```ts
import { createContextsModule } from "@/modules/contexts";
export const contextsModule = createContextsModule();
```

- [ ] **Step 5: Update imports**

Run:

```bash
rg -n "@/modules/activity|activityContextsModule|createActivityContextsModule" src
```

Replace all imports/usages with `@/modules/contexts`, `contextsModule`, and `createContextsModule`.

- [ ] **Step 6: Verify rename compiles**

Run:

```bash
npm run ddd:check
npm run build
```

Expected: both pass, or only fail on known route/module names that Task 2 resolves.

---

## Task 2: Rename Public API from `/api/activity-contexts` to `/api/contexts`

**Files:**
- Move: `src/app/api/activity-contexts` -> `src/app/api/contexts`
- Modify: `src/app/api/contexts/route.ts`
- Modify: `src/app/api/contexts/[id]/route.ts`
- Modify: `src/app/api/contexts/responses.ts`
- Modify: `src/app/api/contexts/validation.ts`
- Modify: frontend API clients and tests using `/api/activity-contexts`

- [ ] **Step 1: Move route directory**

Run:

```bash
mv src/app/api/activity-contexts src/app/api/contexts
```

- [ ] **Step 2: Update route imports**

In both route handlers, import from `contextsModule` and `presentContext`:

```ts
import { contextsModule } from "@/lib/container";
import { presentContext } from "@/modules/contexts";
```

Route anatomy must stay:

```ts
const authContext = await getAuthenticatedRequestContext();
if (!authContext.ok) return authContext.response;
const { supabase, user } = authContext;

const parsed = parseCreateContextRequest(body);
if (!parsed.ok) return errorResponse(parsed.error);

contextsModule.bindRequest(supabase);
```

- [ ] **Step 3: Rename response contract types**

In `src/app/api/contexts/responses.ts`, rename response types to:

```ts
export type ContextResponseType = "employment" | "project" | "personal" | "other";
export type ContextResponseStatus = "active" | "archived";

export interface ContextResponse {
  id: string;
  userId: string;
  type: ContextResponseType;
  status: ContextResponseStatus;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ListContextsResponse = {
  contexts: ContextResponse[];
};

export type CreateContextResponse = ContextResponse;
export type UpdateContextResponse = ContextResponse;
```

Keep the response camelCase.

- [ ] **Step 4: Rename validation types**

In `src/app/api/contexts/validation.ts`, rename to:

```ts
export interface CreateContextHttpInput {
  type: ContextType;
  name: string;
}

export interface UpdateContextHttpInput {
  type?: ContextType;
  name?: string;
  status?: ContextStatus;
}

export function parseCreateContextRequest(body: unknown): Result<CreateContextHttpInput, HttpValidationError> {
  // preserve current validation behavior
}

export function parseUpdateContextRequest(body: unknown): Result<UpdateContextHttpInput, HttpValidationError> {
  // preserve current validation behavior
}
```

- [ ] **Step 5: Update frontend and tests**

Run:

```bash
rg -n "/api/activity-contexts|activity-contexts|ActivityContext" src test
```

Update frontend API URLs to `/api/contexts`, response type imports to `src/app/api/contexts/responses`, and test names to “Context”.

- [ ] **Step 6: Verify route contract**

Run:

```bash
npm run build
```

Expected: Next build passes without server/client import boundary errors.

---

## Task 3: Rename Domain Types Inside Canonical Module

**Files:**
- Move: `src/modules/contexts/domain/entities/activity-context.entity.ts` -> `src/modules/contexts/domain/entities/context.entity.ts`
- Move: `src/modules/contexts/domain/repositories/activity-context.repository.ts` -> `src/modules/contexts/domain/repositories/context.repository.ts`
- Move: `src/modules/contexts/infrastructure/repositories/supabase-activity-context.repository.ts` -> `src/modules/contexts/infrastructure/repositories/supabase-context.repository.ts`
- Move: use cases and tests under `src/modules/contexts/application/use-cases`
- Move: errors under `src/modules/contexts/domain/errors`
- Move: presenter to `src/modules/contexts/application/presenters/context-presenters.ts`

- [ ] **Step 1: Move files**

Run:

```bash
mv src/modules/contexts/domain/entities/activity-context.entity.ts src/modules/contexts/domain/entities/context.entity.ts
mv src/modules/contexts/domain/entities/activity-context.entity.test.ts src/modules/contexts/domain/entities/context.entity.test.ts
mv src/modules/contexts/domain/repositories/activity-context.repository.ts src/modules/contexts/domain/repositories/context.repository.ts
mv src/modules/contexts/infrastructure/repositories/supabase-activity-context.repository.ts src/modules/contexts/infrastructure/repositories/supabase-context.repository.ts
mv src/modules/contexts/infrastructure/repositories/supabase-activity-context.repository.test.ts src/modules/contexts/infrastructure/repositories/supabase-context.repository.test.ts
mv src/modules/contexts/application/presenters/activity-context-presenters.ts src/modules/contexts/application/presenters/context-presenters.ts
```

- [ ] **Step 2: Rename use case files**

Run:

```bash
for file in src/modules/contexts/application/use-cases/*activity-context*.ts; do mv "$file" "${file//activity-context/context}"; done
```

- [ ] **Step 3: Rename classes and interfaces**

Use editor refactors or targeted replacement:

```bash
rg -n "ActivityContext|activityContext|activity context|activity_context" src/modules/contexts src/app/api/contexts src/lib/container.ts
```

Expected canonical names:

```ts
export type ContextType = "employment" | "project" | "personal" | "other";
export type ContextStatus = "active" | "archived";

export interface ContextPrimitives {
  id: string;
  userId: string;
  type: ContextType;
  name: string;
  status: ContextStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export class Context extends AggregateRoot {
  // same behavior as old ActivityContext
}
```

Repository stays mapped to DB table:

```ts
export class SupabaseContextRepository extends BoundSupabaseRepository implements ContextRepository {
  async search(userId: UserId): Promise<Context[]> {
    const { data, error } = await this.client
      .from("activity_contexts")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as ContextRow[]).map(rowToContext);
  }
}
```

- [ ] **Step 4: Keep DB naming isolated**

Only infrastructure files may mention `activity_contexts`, `activity_context_id`, `count_activity_context_records`, or `reassign_activity_context_records`.

Run:

```bash
rg -n "activity_context|ActivityContext|activityContext" src/modules/contexts src/app/api/contexts src/lib/container.ts
```

Expected: only infrastructure DB references remain, plus migration/test descriptions where unavoidable.

- [ ] **Step 5: Verify DDD test naming**

Run:

```bash
npm run ddd:check
```

Expected: pass. If `verify-ddd-tests` fails, ensure every renamed use case and repository has a same-basename `.test.ts`.

---

## Task 4: Move Work Journal Context Lifecycle to Contexts Module

**Files:**
- Modify: `src/modules/work-journal/work-journal.module.ts`
- Modify: `src/modules/work-journal/application/use-cases/create-entry.use-case.ts`
- Modify: `src/modules/work-journal/application/use-cases/update-entry.use-case.ts`
- Modify: `src/modules/work-journal/application/use-cases/draft-entry.use-case.ts`
- Modify: `src/modules/work-journal/domain/entities/journal-entry.entity.ts`
- Modify: `src/modules/work-journal/infrastructure/repositories/supabase-work-journal-entry.repository.ts`
- Modify: `src/app/api/work-journal/entries/route.ts`
- Modify: `src/app/api/work-journal/entries/[id]/route.ts`
- Modify: `src/app/api/work-journal/entries/draft/route.ts`
- Delete: work-journal context use cases/entities/repos listed above when unused.

- [ ] **Step 1: Decide validation ownership**

Recommended: validate context existence in the route/controller by calling `contextsModule.getContext` or `contextsModule.ensureUsableContext` before calling Work Journal use cases. This keeps Work Journal from depending directly on the Contexts module repository and avoids cross-module repository imports.

- [ ] **Step 2: Add a context lookup use case if missing**

Create in `src/modules/contexts/application/use-cases/get-context.use-case.ts`:

```ts
import { EntityId, UserId } from "@/modules/shared";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import type { Context } from "../../domain/entities/context.entity";
import type { ContextRepository } from "../../domain/repositories/context.repository";

export class GetContextUseCase {
  constructor(private readonly deps: { contextRepo: ContextRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<Context> {
    const context = await this.deps.contextRepo.findById(
      EntityId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
    if (!context) throw new ContextNotFoundError(input.id);
    return context;
  }
}
```

Add test `get-context.use-case.test.ts` for found and not found.

- [ ] **Step 3: Add usable-context validation if archived contexts are rejected**

Create in `src/modules/contexts/application/use-cases/ensure-usable-context.use-case.ts`:

```ts
import { EntityId, UserId } from "@/modules/shared";
import { ContextArchivedError } from "../../domain/errors/context-archived.error";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import type { ContextRepository } from "../../domain/repositories/context.repository";

export class EnsureUsableContextUseCase {
  constructor(private readonly deps: { contextRepo: ContextRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<void> {
    const context = await this.deps.contextRepo.findById(
      EntityId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
    if (!context) throw new ContextNotFoundError(input.id);
    if (context.status !== "active") throw new ContextArchivedError(input.id);
  }
}
```

Wire it into `src/modules/contexts/contexts.module.ts`.

- [ ] **Step 4: Remove context repo dependency from Work Journal entry use cases**

Change `CreateEntryUseCase` constructor from:

```ts
constructor(private readonly deps: { contextRepo: WorkJournalContextRepository; entryRepo: WorkJournalEntryRepository; tracker: EventTracker }) {}
```

to:

```ts
constructor(private readonly deps: { entryRepo: WorkJournalEntryRepository; tracker: EventTracker }) {}
```

Remove context lookup from the use case. It should accept a known-good `context_id` from the route and create `JournalEntry`.

- [ ] **Step 5: Bind and validate in routes**

In `src/app/api/work-journal/entries/route.ts`, after validation and before create:

```ts
workJournalModule.bindRequest(supabase);
contextsModule.bindRequest(supabase);
await contextsModule.ensureUsableContext.execute({
  id: parsed.value.context_id,
  userId: user.id,
});
const entry = await workJournalModule.createEntry.execute(user.id, parsed.value);
```

Do the same for update when `context_id` is present and draft when `contextId` is provided.

- [ ] **Step 6: Remove Work Journal context lifecycle use cases from module**

In `src/modules/work-journal/work-journal.module.ts`, remove:

```ts
listContexts
createContext
updateContext
ensureDefaultContext
listContextSuggestions
handleSuggestionAction
contextRepo.bindRequest(client)
```

Keep `cvDataRepo` only if still needed by journal AI flows.

- [ ] **Step 7: Delete legacy Work Journal context routes**

Delete:

```bash
rm -r src/app/api/work-journal/contexts
```

If frontend still uses those routes, update frontend first to `/api/contexts`.

- [ ] **Step 8: Delete unused Work Journal context domain files**

Run:

```bash
rg -n "WorkJournalContext|work-journal-context|contextRepo|listContexts|createContext|updateContext|ensureDefaultContext|listContextSuggestions|handleSuggestionAction" src/modules/work-journal src/app/api/work-journal
```

Delete only files no longer referenced.

- [ ] **Step 9: Verify**

Run:

```bash
npm run test:backend -- --run src/modules/work-journal
npm run ddd:check
npm run build
```

Expected: pass.

---

## Task 5: Move Commitments Context Lifecycle to Contexts Module

**Files:**
- Modify: `src/modules/commitments/commitments.module.ts`
- Modify: `src/modules/commitments/application/use-cases/create-commitment.use-case.ts`
- Modify: `src/modules/commitments/application/use-cases/update-commitment.use-case.ts`
- Modify: `src/app/api/commitments/route.ts`
- Modify: `src/app/api/commitments/[id]/route.ts`
- Delete: commitment context use cases/entities/repos listed above when unused.

- [ ] **Step 1: Remove context repo dependency from commitments module**

In `src/modules/commitments/commitments.module.ts`, remove:

```ts
const contextRepo = new SupabaseCommitmentContextRepository();
ensureDefaultContext
createContext
updateContext
contextRepo.bindRequest(client)
```

If `listWorkspace` currently needs contexts for response composition, move that composition to the API route by calling `contextsModule.listContexts` alongside `commitmentsModule.listWorkspace`.

- [ ] **Step 2: Validate context in commitment routes**

In `src/app/api/commitments/route.ts` before create:

```ts
commitmentsModule.bindRequest(supabase);
contextsModule.bindRequest(supabase);
await contextsModule.ensureUsableContext.execute({
  id: parsed.value.contextId,
  userId: user.id,
});
const commitment = await commitmentsModule.createCommitment.execute({
  userId: user.id,
  ...parsed.value,
});
```

In update route, validate only when `contextId` is provided.

- [ ] **Step 3: Update workspace response composition**

If `ListCommitmentsWorkspaceUseCase` currently returns contexts, change it to return only commitments, items, and outcomes. Then in `src/app/api/commitments/route.ts`, build the workspace response with:

```ts
const [workspace, contexts] = await Promise.all([
  commitmentsModule.listWorkspace.execute(user.id, filters),
  contextsModule.listContexts.execute(user.id),
]);
```

Use `presentContext` for contexts.

- [ ] **Step 4: Delete legacy Commitments context routes**

Delete:

```bash
rm -r src/app/api/commitments/contexts
```

Update frontend calls to use `/api/contexts`.

- [ ] **Step 5: Delete unused Commitments context domain files**

Run:

```bash
rg -n "CommitmentContext|commitment-context|contextRepo|createContext|updateContext|ensureDefaultContext" src/modules/commitments src/app/api/commitments
```

Delete only files no longer referenced.

- [ ] **Step 6: Verify**

Run:

```bash
npm run test:backend -- --run src/modules/commitments
npm run ddd:check
npm run build
```

Expected: pass.

---

## Task 6: Consolidate Received Feedback Context Usage

**Files:**
- Modify: `src/modules/received-feedback/domain/entities/received-feedback.entity.ts`
- Modify: `src/modules/received-feedback/application/use-cases/create-received-feedback.use-case.ts`
- Modify: `src/modules/received-feedback/application/use-cases/update-received-feedback.use-case.ts`
- Modify: `src/app/api/received-feedback/route.ts`
- Modify: `src/app/api/received-feedback/[id]/route.ts` if present.

- [ ] **Step 1: Confirm current state**

Run:

```bash
rg -n "activityContextId|contextId|contextsModule|received-feedback" src/modules/received-feedback src/app/api/received-feedback
```

- [ ] **Step 2: Rename API field only if frontend contract allows it**

Recommended for now: keep `activityContextId` in received-feedback API if changing it would expand frontend blast radius. Internally, prefer `contextId` in use case inputs and map the HTTP field in route validation.

- [ ] **Step 3: Validate context in routes**

Before create/update with a context:

```ts
contextsModule.bindRequest(supabase);
await contextsModule.ensureUsableContext.execute({
  id: parsed.value.contextId,
  userId: user.id,
});
```

- [ ] **Step 4: Verify**

Run:

```bash
npm run test:backend -- --run src/modules/received-feedback
npm run build
```

Expected: pass.

---

## Task 7: Frontend Cutover to Canonical Context API

**Files:**
- Search result dependent: `src/features/**`
- Search result dependent: `src/components/**`
- Search result dependent: `src/frontend/**`
- Search result dependent: frontend API tests.

- [ ] **Step 1: Find all consumers**

Run:

```bash
rg -n "/api/activity-contexts|/api/work-journal/contexts|/api/commitments/contexts|activityContext|ActivityContext|WorkJournalContext|CommitmentContext" src/features src/components src/frontend src/app
```

- [ ] **Step 2: Update HTTP clients**

All context lifecycle calls should use:

```ts
const response = await fetch("/api/contexts", { method: "GET" });
const response = await fetch("/api/contexts", { method: "POST", body: JSON.stringify(payload) });
const response = await fetch(`/api/contexts/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
const response = await fetch(`/api/contexts/${id}`, { method: "DELETE" });
```

- [ ] **Step 3: Update query keys**

Use one shared contexts query key, for example:

```ts
export const contextQueryKeys = {
  all: ["contexts"] as const,
  lists: () => [...contextQueryKeys.all, "list"] as const,
};
```

Do not keep separate `workJournalContexts` and `commitmentContexts` caches after this task.

- [ ] **Step 4: Preserve selected context behavior**

Where feature screens previously selected a feature-specific context, keep the UI behavior but source options from canonical contexts. Entry/commitment/feedback creation should submit the selected context ID.

- [ ] **Step 5: Verify UI build**

Run:

```bash
npm run build
```

Expected: pass.

---

## Task 8: Database Cleanup for Legacy Feature Context Tables

**Files:**
- Create: `supabase/migrations/<timestamp>_drop_legacy_feature_context_tables.sql`
- Modify tests if they seed `work_journal_contexts` or `commitment_contexts`.

- [ ] **Step 1: Confirm no code reads legacy tables**

Run:

```bash
rg -n "work_journal_contexts|commitment_contexts" src supabase/migrations scripts tests
```

Expected: no source code references. Old migration files may still reference them historically.

- [ ] **Step 2: Create cleanup migration**

Migration body:

```sql
drop table if exists public.work_journal_contexts;
drop table if exists public.commitment_contexts;
```

Only add this after local tests prove no active source code uses those tables.

- [ ] **Step 3: Verify locally only**

Run:

```bash
npm run test:backend
```

Expected: Supabase E2E stack starts and all backend tests pass.

Do not apply this migration to production. Production application remains user-owned per repo instructions.

---

## Task 9: Documentation and ADR Update

**Files:**
- Modify: `docs/adr/0001-activity-contexts-own-shared-user-spheres.md`
- Add or modify architecture docs if a contexts module page exists under `docs/architecture`.

- [ ] **Step 1: Rename ADR title**

Change title to:

```md
# Contexts Own Shared User Spheres
```

- [ ] **Step 2: Update ADR body**

Use:

```md
Contexts are owned by a dedicated module rather than by journal, commitments, or received feedback because they represent the same reusable user sphere across those product areas. Feature sections may offer embedded UI for creating and selecting contexts, but they reference them by ID and delegate creation, listing, archiving, deletion, assignment counting, and reassignment to the Contexts module so records stay unified across the app.
```

- [ ] **Step 3: Document DB naming caveat**

Add:

```md
The database table is currently `activity_contexts` for compatibility with the first migration. Application code should treat that as an infrastructure detail hidden inside `src/modules/contexts/infrastructure`.
```

- [ ] **Step 4: Verify docs references**

Run:

```bash
rg -n "Activity Context|activity context|activity-contexts|activityContextsModule|/api/activity-contexts" docs src
```

Expected: only deliberate historical migration references remain.

---

## Task 10: Final Verification

**Files:**
- No direct code changes unless verification exposes misses.

- [ ] **Step 1: Run focused backend suites**

Run:

```bash
npm run test:backend -- --run src/modules/contexts src/modules/work-journal src/modules/commitments src/modules/received-feedback
```

Expected: pass.

- [ ] **Step 2: Run architecture checks**

Run:

```bash
npm run ddd:check
```

Expected: pass.

- [ ] **Step 3: Run full build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 4: Check for leftovers**

Run:

```bash
rg -n "src/modules/activity|@/modules/activity|activityContextsModule|ActivityContext|activityContext|/api/activity-contexts|WorkJournalContext|CommitmentContext|work_journal_contexts|commitment_contexts" src docs
```

Expected: no active source references except infrastructure DB names and historical migration files.

- [ ] **Step 5: Manual smoke test locally**

Start the app and verify:

```bash
npm run dev
```

Smoke:

- Create a context from the shared contexts UI.
- Create a work journal entry using that context.
- Create a commitment using that context.
- Create received feedback using that context.
- Archive or delete a non-default context and confirm assigned records are reassigned or blocked according to current UX.

---

## Execution Notes

- Do not create commits automatically. The task boundaries are commit-sized, but leave changes uncommitted for review.
- Do not push to `main`.
- Do not apply migrations to production.
- If any change touches auth email templates, restart local Supabase before asking for testing; this migration should not touch those templates.
- After any change under `src/modules`, `src/lib`, `src/app`, `src/components`, `src/features`, or `src/frontend`, run `npm run build` before finishing.

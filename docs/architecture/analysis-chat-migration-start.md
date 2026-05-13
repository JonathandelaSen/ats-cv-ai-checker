# Analysis chat migration start

## Purpose

This document defines how to start migrating `analysis-chat` from legacy `src/lib/db.ts` access to a DDD module under `src/modules/analysis-chat`.

It is the handoff document for the next migration step. Read it together with `docs/architecture/ddd-module-map.md`.

## Module selected

Start with `analysis-chat`.

Why this module first:

- It has clear persistence boundaries: `analysis_chat_conversations` and `analysis_chat_messages`.
- It has a focused domain: conversations and messages over an analysis context.
- It is smaller than splitting `analyses`.
- It forces the cross-module query bus design without requiring the full `cv-analysis` / `job-match-analysis` migration first.

Main risk:

- The chat currently points to legacy `analyses.analysis_id`.
- Until `cv-analysis` and `job-match-analysis` exist, `analysis-chat` must obtain analysis context through a legacy read use case exposed through the query bus.

## Scope for the first migration slice

In scope:

- Create shared query bus primitives.
- Create architecture checks for query bus usage.
- Create `analysis-chat` module structure.
- Implement the full vertical slice: domain, application, infrastructure, route integration, and compatibility presenters.
- Add local Supabase migrations if the slice requires schema changes.
- Move conversation/message persistence behind `analysis-chat` repositories.
- Move send-message behavior behind an `analysis-chat` use case.
- Use a query bus call to obtain analysis context.
- Keep current product behavior and API responses stable.

Out of scope:

- Splitting the legacy `analyses` table.
- Renaming `analysis_id` columns.
- Changing the chat UI.
- Expanding chat beyond the current job-match/offer-chat behavior.
- Migrating `cv-analysis` or `job-match-analysis`.
- Applying production migrations.

## Definition of done

This migration slice is not complete when only the domain layer exists.

It is complete only when all of the following are true:

- `analysis-chat` has domain entities/value objects with tests.
- `analysis-chat` has application use cases and query handlers with tests.
- `analysis-chat` has Supabase infrastructure repositories with backend tests.
- Any required database migration files are created, reviewed, and verified locally.
- `analysis-chat` has an AI service adapter that uses the existing prompt/controller split.
- `src/app/api/analyses/[id]/chat/route.ts` calls the new module instead of `src/lib/db.ts` chat helpers directly.
- The current API contract and UI behavior remain stable.
- Query bus architecture checks are added and wired into `npm run ddd:check`.
- Relevant backend tests and `npm run ddd:check` pass.
- Remaining legacy dependencies are documented explicitly as transition points.

## Target module structure

```txt
src/modules/
  shared/
    application/
      query-bus/
        query.ts
        query-handler.ts
        query-bus.ts
        in-memory-query-bus.ts
        unregistered-query-handler.error.ts
  analysis-chat/
    domain/
      entities/
        conversation.entity.ts
        chat-message.entity.ts
      value-objects/
        analysis-chat-conversation-id.value-object.ts
        analysis-chat-message-id.value-object.ts
        analysis-chat-role.value-object.ts
        analysis-chat-content.value-object.ts
        analysis-reference.value-object.ts
      repositories/
        conversation.repository.ts
        chat-message.repository.ts
        analysis-chat-ai-service.repository.ts
      errors/
        conversation-not-found.error.ts
        analysis-context-not-found.error.ts
    application/
      queries/
        get-legacy-analysis-chat-context.query.ts
        get-legacy-analysis-chat-context.query-handler.ts
      use-cases/
        list-conversations.use-case.ts
        create-conversation.use-case.ts
        rename-conversation.use-case.ts
        delete-conversation.use-case.ts
        list-messages.use-case.ts
        send-message.use-case.ts
        get-legacy-analysis-chat-context.use-case.ts
      presenters/
        analysis-chat-presenters.ts
    infrastructure/
      repositories/
        supabase-conversation.repository.ts
        supabase-chat-message.repository.ts
      services/
        gemini-analysis-chat-ai.service.ts
    analysis-chat.module.ts
    index.ts
```

Notes:

- The exact value object names may be shortened if they stay unambiguous inside the module.
- `get-legacy-analysis-chat-context` is intentionally temporary. It exists because `analyses` is not migrated yet.
- When `cv-analysis` and `job-match-analysis` exist, replace the legacy query with public queries from those modules.

## Query bus design

### Core rule

Queries always represent read use cases.

A query handler must execute the corresponding use case. It must not contain independent business logic and must not call repositories directly unless the corresponding use case itself is the handler dependency.

### Naming pattern

For a read operation named `GetLegacyAnalysisChatContext`:

- Query: `GetLegacyAnalysisChatContextQuery`
- Handler: `GetLegacyAnalysisChatContextQueryHandler`
- Use case: `GetLegacyAnalysisChatContextUseCase`

The handler shape must be:

```ts
export class GetLegacyAnalysisChatContextQueryHandler
  implements QueryHandler<GetLegacyAnalysisChatContextQuery, AnalysisChatContext | null>
{
  constructor(
    private readonly useCase: GetLegacyAnalysisChatContextUseCase
  ) {}

  async handle(query: GetLegacyAnalysisChatContextQuery) {
    return this.useCase.execute(query.payload);
  }
}
```

### Query shape

Use class-based queries with a stable static name.

Example:

```ts
export class GetLegacyAnalysisChatContextQuery
  implements Query<GetLegacyAnalysisChatContextInput>
{
  static readonly queryName = "analysis-chat.get-legacy-analysis-chat-context";

  readonly queryName = GetLegacyAnalysisChatContextQuery.queryName;

  constructor(
    public readonly payload: GetLegacyAnalysisChatContextInput
  ) {}
}
```

The exact generic names can be refined during implementation, but the behavior must stay:

- each query has a unique name
- each query carries payload only
- query handlers are registered by query name
- `queryBus.execute(query)` dispatches to the registered handler
- missing handlers throw `UnregisteredQueryHandlerError`

### Query bus interface

Target interfaces:

```ts
export interface Query<TPayload, TResult> {
  readonly queryName: string;
  readonly payload: TPayload;
}

export interface QueryHandler<TQuery extends Query<unknown, unknown>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

export interface QueryBus {
  execute<TResult>(query: Query<unknown, TResult>): Promise<TResult>;
}
```

Target registration API:

```ts
queryBus.register(GetLegacyAnalysisChatContextQuery.queryName, handler);
```

Register handlers by query name string. Enforce this style in architecture checks.

### Composition

Composition roots register query handlers.

For this first slice, `createAnalysisChatModule(...)` receives a `queryBus` that already has required handlers registered. The module should fail fast if a required query is executed without a registered handler.

Preferred for future cross-module work:

- App-level composition creates one query bus for a request/module graph.
- Each module factory can expose a `registerQueries(queryBus)` function.
- Route handlers wire the module and call use cases.

Avoid hidden global singleton state. Tests should be able to create an isolated query bus.

## Legacy analysis context query

### Why it exists

`analysis-chat` needs context from legacy `analyses` to build Gemini prompts. Today this data is still in `src/lib/db.ts` and the `analyses` table.

Until the analysis split is done, use:

- `GetLegacyAnalysisChatContextQuery`
- `GetLegacyAnalysisChatContextUseCase`
- `GetLegacyAnalysisChatContextQueryHandler`

### Ownership

This temporary query lives in `analysis-chat/application/queries` during the transition because no migrated analysis module owns the data yet.

Mark it clearly as legacy in the class/file name and comments.

When `cv-analysis` and `job-match-analysis` exist:

- remove this legacy query
- add public read use cases/queries to those modules
- make `analysis-chat` execute the new public queries through the query bus

### Use from `SendMessageUseCase`

`SendMessageUseCase` receives the query bus:

```ts
export class SendMessageUseCase {
  constructor(
    private readonly deps: {
      conversationRepo: ConversationRepository;
      messageRepo: ChatMessageRepository;
      aiService: AnalysisChatAIService;
      queryBus: QueryBus;
      tracker: EventTracker;
    }
  ) {}
}
```

Inside execution:

```ts
const context = await this.deps.queryBus.execute(
  new GetLegacyAnalysisChatContextQuery({
    analysisId,
    userId,
  })
);

if (!context) {
  throw new AnalysisContextNotFoundError();
}
```

Then the use case passes the context to the AI service.

The AI service may receive primitives/read data derived from the aggregate/context. The AI service must not fetch database context itself.

## Domain model guidance

### `Conversation`

Represents a chat thread for one analysis reference.

Expected primitives:

- `id`
- `userId`
- `analysisReference`
- `title`
- `createdAt`
- `updatedAt`

Behavior:

- create
- rename
- delete event recording if needed

### `ChatMessage`

Represents one message in a conversation.

Expected primitives:

- `id`
- `userId`
- `analysisReference`
- `conversationId`
- `role`
- `content`
- `model`
- `metadata`
- `createdAt`

Behavior:

- create user message
- create assistant message

### `AnalysisReference`

For the first slice, this can wrap the legacy `analysisId`.

Future-proof shape:

```ts
type AnalysisReferencePrimitives =
  | { type: "legacy_analysis"; id: string }
  | { type: "cv_analysis"; id: string }
  | { type: "job_match_analysis"; id: string };
```

Persistence may still write to `analysis_id` while legacy tables remain. The repository maps between `AnalysisReference` and legacy columns.

## Route migration guidance

Current route:

- `src/app/api/analyses/[id]/chat/route.ts`

Expected route behavior after migration:

- Route still accepts the same URL and payloads.
- Route preserves the current restriction that only legacy `job_match` analyses can use offer chat.
- Route creates/authenticates Supabase in the route layer.
- Route creates `SupabaseEventTracker`.
- Route creates/registers the query bus and module.
- Route calls `mod.listConversations`, `mod.sendMessage`, etc.
- Route returns presenters from `analysis-chat`.

Do not move `getAuthedSupabase()` into the module.

## Database migrations

This first slice should prefer using the existing tables if possible:

- `analysis_chat_conversations`
- `analysis_chat_messages`

If implementation requires schema changes, add Supabase migration files under `supabase/migrations/` and verify them locally.

Possible schema-change triggers:

- adding a typed analysis reference
- adding legacy/source reference fields
- adding constraints or indexes required by the new repository methods
- changing observability references

Rules:

- Do not apply migrations to production.
- Keep migration files backward-compatible with current data where possible.
- Include backfill SQL in the migration if a new non-null column depends on existing rows.
- Verify locally with backend tests and, when relevant, Supabase reset/start workflow.
- Mention any manual production application steps in the final handoff, but leave production application to the user unless explicitly requested in that same turn.

## Architecture checks to add

Add scripts under `scripts/` and wire them into `npm run ddd:check`.

### `scripts/verify-query-bus.mjs`

Purpose: enforce the query bus conventions.

Checks:

- Every `src/modules/**/application/queries/*.query.ts` file exports a class ending in `Query`.
- Every query class has a matching `*.query-handler.ts` file.
- Every query handler class name follows `<QueryName>Handler`.
- Every query handler imports or references a use case whose name matches the query without `Query`.
- Query handler `handle()` delegates to `.execute(...)` on the use case.
- Query handler files must not import infrastructure repositories directly.
- Query handler files must not call `.from(`, `.insert(`, `.update(`, `.delete(`, or `.select(`.
- Query names must be unique across modules.

Expected failure message style:

```txt
Query bus violations:
- src/modules/foo/application/queries/get-bar.query-handler.ts (query-handler-no-use-case): GetBarQueryHandler must delegate to GetBarUseCase.
```

### Extend `scripts/verify-ddd-imports.mjs`

Add checks for cross-module use:

- Feature modules may import public query classes/types from another module's `index.ts`.
- Feature modules must not import another module's internal `application/use-cases`, `domain`, or `infrastructure` files.
- Query handlers are allowed to import use cases from their own module only.

### Extend `scripts/verify-ddd-tests.mjs`

Add coverage expectations:

- Every `application/queries/*.query-handler.ts` has a colocated `*.test.ts`.
- Every shared query bus implementation has tests.
- `UnregisteredQueryHandlerError` behavior is tested.

### Optional script: `scripts/verify-module-public-api.mjs`

Purpose:

- Ensure cross-module imports only target module public barrels.
- Prevent accidental imports like `@/modules/job-match-analysis/infrastructure/...`.

This may overlap with `verify-ddd-imports.mjs`; implement it separately only if the import script becomes too broad.

## Tests required for this slice

Shared query bus:

- registers a handler
- executes the correct handler
- returns handler result
- throws on unregistered query
- prevents duplicate query registration or handles it explicitly

Analysis chat domain:

- `Conversation.create`
- `Conversation.fromPrimitives`
- `Conversation.toPrimitives`
- rename validation
- `ChatMessage.createUserMessage`
- `ChatMessage.createAssistantMessage`
- role/content validation

Infrastructure repositories:

- list conversations by legacy analysis reference and user
- create conversation
- rename conversation
- delete conversation
- list messages
- create message

Application:

- list conversations
- send message happy path
- send message when analysis context is missing
- send message records user and assistant messages
- send message records observability
- send message calls query bus with `GetLegacyAnalysisChatContextQuery`
- send message does not call AI service when context is missing

Do not test Gemini directly. Mock the AI service in use-case tests.

## Observability

New/edited backend actions in this module must use `EventTracker`.

Suggested event names:

- `analysis_chat_conversation_created`
- `analysis_chat_conversation_renamed`
- `analysis_chat_conversation_deleted`
- `analysis_chat_message_sent`
- `analysis_chat_ai_response_created`
- `analysis_chat_ai_response_failed`

Keep observability in use cases, not route handlers.

## Migration strategy

1. Add shared query bus primitives and tests.
2. Add query bus architecture check and wire it into `npm run ddd:check`.
3. Create `analysis-chat` domain entities/value objects and tests.
4. Create repository ports.
5. Decide whether existing chat tables are enough.
6. Add and locally verify Supabase migrations if schema changes are needed.
7. Create Supabase repositories and backend tests.
8. Create `GetLegacyAnalysisChatContextUseCase`, query, and query handler.
9. Create `SendMessageUseCase` using query bus.
10. Create module factory and presenters.
11. Switch `src/app/api/analyses/[id]/chat/route.ts` to the module.
12. Remove direct route usage of legacy chat helpers from `src/lib/db.ts`.
13. Keep any temporary legacy analysis context access isolated behind `GetLegacyAnalysisChatContextUseCase`.
14. Run `npm run ddd:check`.
15. Run targeted backend tests for `analysis-chat`.
16. Run broader backend tests if the route behavior changed significantly.

## Next steps

When starting the next implementation turn:

1. Read this document and `docs/architecture/ddd-module-map.md`.
2. Inspect current `src/app/api/analyses/[id]/chat/route.ts`.
3. Inspect current chat prompt/controller files:
   - `src/lib/ai-offer-chat-prompts.ts`
   - any AI chat service/controller used by the route
4. Inspect current db helpers for:
   - `analysis_chat_conversations`
   - `analysis_chat_messages`
   - `getAnalysis`
5. Implement the shared query bus first.
6. Add query bus architecture checks before migrating the route.
7. Check whether database migrations are needed; if yes, add local migration files and verify them locally.
8. Migrate `analysis-chat` in small steps, keeping the existing API shape stable.
9. Do not touch the split of `analyses` yet.
10. Do not apply production migrations.

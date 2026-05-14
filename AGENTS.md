## Supabase local auth email templates

When changing `supabase/config.toml` auth email template settings or any file in `supabase/templates/`, restart the local Supabase stack before asking the user to test. Use `npm run supabase:stop` followed by `npm run supabase:start`, then mention the local Mailpit URL from `supabase status`.

## Supabase production migrations

Never apply migrations or schema changes to the production Supabase project. Prepare and verify migration files locally, but leave production application to the user unless they explicitly instruct otherwise in the same turn.

## AI prompts and model controllers

Keep prompts and model-call logic/controllers in separate files. La lógica/controladores que llaman a modelos debe mantenerse en archivos separados de los prompts. Prompt builders/system instructions belong in prompt-only modules, and files that instantiate SDK clients or call model APIs must import those prompts instead of defining them inline. This reduces the risk that prompt edits break API integration code.

## AI prompt documentation

Every AI prompt family must have documentation under `docs/prompts/<prompt-type>/prompt.md`. The document must include the current prompt, the source file link/path, how it is fed with data, the runtime flow, and maintenance notes. When changing a prompt, prompt builder, model input data, response shape, or controller behavior that affects a prompt, actualizar la documentación del prompt en el mismo cambio.

## Git main branch

Never push to `main`. Commit locally or push to a non-main branch if requested, but leave `main` pushes to the user unless they explicitly instruct otherwise in the same turn.

## Worktrees

Work directly on `main` (the primary checkout) by default. Do not create git worktrees or switch to alternate branches unless the user explicitly asks for it in the same turn. If worktrees were created in earlier turns, clean them up and continue on `main`.

Do not add [extensions] worktreeConfig = true" to .git/config because it breaks antigravity IDE

## shadcn/ui

We will use shadcn/ui whenever there is a useful component in the library. We will not reinvent the wheel and will prefer existing shadcn components over creating custom UI components from scratch.

## Observability

All new or edited actions that occur on the platform and have backend interaction must be added to observability.

## Hexagonal architecture (DDD modules)

The backend is being migrated progressively from `src/lib/db.ts` to hexagonal architecture under `src/modules/`. **Work Journal** is the first migrated module and serves as the reference pattern for future modules.

### Module structure

```
src/modules/
  shared/                              ← Cross-module infrastructure
    domain/repositories/               ← Interfaces (EventTracker)
    infrastructure/repositories/       ← Implementations (SupabaseEventTracker)
    infrastructure/supabase-aware.ts   ← SupabaseAware interface for bindRequest pattern
    infrastructure/http/               ← HTTP helpers (handleDomainError)
  <module-name>/
    domain/
      entities/                        ← AggregateRoot classes with identity and domain logic
      value-objects/                   ← Immutable ValueObject classes, one per file
      events/                          ← DomainEvent classes emitted by aggregate roots
      repositories/                    ← Port interfaces (repository + service contracts)
      services/                        ← Pure domain logic (no I/O)
      errors/                          ← Domain-specific error classes extending Error
    application/
      use-cases/                       ← One class per use case, receives deps via constructor
    infrastructure/
      repositories/                    ← Supabase implementations of domain ports
      services/                        ← External service implementations (AI, etc.)
    <module-name>.module.ts            ← Composition root / factory function
    index.ts                           ← Barrel file exporting public API
```

### Key conventions

- **Domain uses camelCase**. `snake_case` belongs to database rows and HTTP payloads only; infrastructure repositories and route presenters map between DB/API shapes and domain primitives.
- **Entities are aggregate roots**: classes extending `AggregateRoot`, built from ValueObjects, with an ID, `static create(params)`, `static fromPrimitives(primitives)`, `toPrimitives()`, private/protected constructors, and domain methods that record domain events internally.
- **Value objects are immutable**: one `*.value-object.ts` file per VO, `static fromPrimitives(...)`, `toPrimitives()`, private/protected state, no mutating methods. Shared concerns such as IDs, ISO dates, optional ISO dates, timestamps, and user IDs live under `src/modules/shared/domain/value-objects/`.
- **Primitives are boundary data**: `EntityPrimitives` interfaces live with the entity and use camelCase. Only `fromPrimitives` and `toPrimitives` convert between VOs and primitives. Do not pass primitives into entity constructors or domain methods.
- **Repositories work with aggregates and VOs**: aggregate repositories expose `search(criteria)`, `findById(id VO, userId VO)`, `save(aggregate)`, and `delete(id VO, userId VO)`. They must not accept or return `*Primitives`, `Create*Input`, `Update*Input`, or primitive entity fields. Infrastructure repositories map DB `snake_case` rows to domain camelCase primitives and hydrate aggregates.
- **Associations use IDs in the domain**. Do not nest aggregate instances inside other aggregates. Compose read models for UI/API responses in the application/route boundary.
- **Domain events are internal for now**. Aggregate methods record events with `recordDomainEvent`; use cases may call `pullDomainEvents()` later, but `EventTracker` observability stays separate until explicitly migrated.
- **Use cases** receive dependencies via constructor injection (`{ repo, tracker, ... }`).
- **Modules are singletons** constructed once at import time — not rebuilt per request. The app container (`src/lib/container.ts`) is the composition root that wires up all modules, query buses, and query handler registrations. Route handlers import modules from the container.
- **Infrastructure repositories implement `SupabaseAware`** (`src/modules/shared/infrastructure/supabase-aware.ts`). They have no constructor parameters. Instead they expose a `bindRequest(client: SupabaseClient)` method that sets the Supabase client for the current request. The module's own `bindRequest` method delegates to all its repositories. Route handlers call `myModule.bindRequest(supabase)` once per request before calling any use case. **Reference implementation:** `analysis-chat` module.
- **Route handlers** import the module singleton from `src/lib/container.ts`, call `module.bindRequest(supabase)`, and then call use case `.execute()`. HTTP validation (`normalize*` functions) stays in the route handlers.
- **Domain errors** are caught by `handleDomainError()` which maps them to HTTP status codes.
- **AI prompts and controllers live inside their module** under `infrastructure/services/`. Prompt builders go in a `*-prompts.ts` file, and the SDK client call goes in a separate `gemini-*-ai.service.ts` file. Both files are colocated in the same directory. **Reference:** `feedback-notes` module.
- **Cross-module data access uses the query bus**. A use case that needs data from another module must dispatch a query through the `QueryBus` (injected via constructor), never import another module's repository or use case directly. Query classes and handlers live under `application/queries/` in the owning module and are registered in `container.ts`.
- **Cross-module port interfaces** provide minimal contracts (e.g., `CVDataRepository` exposes only what the consuming module needs) when shared infrastructure is unavoidable.
- **`getAuthedSupabase()`** and `validation.ts` helpers stay in the route handler layer, not in the module.

### API controllers, helpers, and CQRS boundaries

- Avoid business-logic helpers under `src/app/api/**`. API-layer helpers should be limited to HTTP concerns such as auth wrappers, request parsing, validation normalization, response mapping, or thin infrastructure adapters that genuinely belong to the API layer.
- API controllers may orchestrate multiple module use cases/commands when the flow requires it. This orchestration is acceptable, but the business decisions and side effects must live inside module use cases, not in controller helper functions.
- Queries must be side-effect free. A query must not persist data, upload/delete files, retry extraction, record business workflow actions, or trigger commands.
- Queries must not execute commands. If a flow needs to read state and then perform an action, orchestrate that explicitly from the API controller or from a command/use case designed for that workflow.
- Prefer explicit idempotent commands for “ensure/retry/prepare” behavior. For example, a flow like “return existing CV extraction if present, otherwise download the CV, extract text, persist it, and return the result” should be modeled as a command/use case, not as a query or API helper.
- Push business workflow logic into modules. Rendering a template CV for analysis, extracting text, choosing the best extracted text, persisting extraction results, producing extraction diagnostics, and recording observability for backend actions belong in module application/infrastructure services, not in `src/app/api` helpers.
- Avoid vague shared helper names for business workflows. Use names that express the use case, such as `EnsureCVDocumentExtractionUseCase` or `PrepareAnalysisInputUseCase`, rather than generic helpers like `create-analysis-input`.

### API controller anatomy

Every route handler in `src/app/api/**` must follow this exact structure. There are no exceptions.

#### 1. Auth + Supabase client — always via `getAuthenticatedRequestContext()`

Use `getAuthenticatedRequestContext()` from `@/app/api/_shared/auth/request-context` as the very first step inside the `try` block. It creates the per-request Supabase client **and** verifies the session in one call, returning a discriminated union:

```ts
const authContext = await getAuthenticatedRequestContext();
if (!authContext.ok) return authContext.response; // 401 already serialized
const { supabase, user } = authContext;
```

- **Never** call `createClient()` directly inside a route handler — always go through `getAuthenticatedRequestContext()`.
- **Never** call `supabase.auth.getUser()` manually in a route handler.
- Extract `supabase` and `user` immediately after the guard.

#### 2. Bind the Supabase client to the module

After obtaining `supabase`, bind it to every module you'll use in this request **before** calling any use case:

```ts
myModule.bindRequest(supabase);
```

Call `bindRequest` once per module per request, right before the first use-case call. If the handler orchestrates multiple modules, bind all of them.

#### 3. Validate the request payload — always before `bindRequest`

Parse and validate query params or body **before** binding and executing use cases. Use a dedicated `parse*` function from the route-local `validation.ts` file. These functions return `{ ok: true, value }` or `{ ok: false, error: { message, status } }`:

```ts
const parsed = parseCreateFeedbackRequest(body);
if (!parsed.ok) {
  return errorResponse(parsed.error); // 400 with error message
}
```

`errorResponse` is imported from `@/modules/shared`.

#### 4. Error handling — always `handleApiError` in the `catch`

Wrap the entire handler body in `try/catch` and delegate all error handling to `handleApiError`:

```ts
} catch (error: unknown) {
  return handleApiError(error);
}
```

`handleApiError` (from `@/modules/shared`) handles:
- `HttpError` (thrown by `notFound()`, `badRequest()`, `forbidden()`, `conflict()`) → proper 4xx status.
- `DomainError` subclasses → 404 for `*NotFoundError`, 400 otherwise.
- Anything else → 500 with console error log.

Do **not** use the legacy `handleDomainError()` from `domain-error-handler.ts` in new route handlers — it uses string-matching on error names and is not maintained. Use `handleApiError` exclusively.

#### 5. Response helpers

Use the response helpers from `@/modules/shared` — never construct `NextResponse` manually:

| Helper | Status | Use for |
|---|---|---|
| `ok(data)` | 200 | Successful reads |
| `created(data)` | 201 | Successful creates |
| `errorResponse(error)` | variable | Validation failures (from `parse*`) |
| `notFound(msg)` | throws 404 | Resource not found (throw inside use case or controller) |
| `badRequest(msg)` | throws 400 | Invalid state detected in controller |
| `forbidden(msg)` | throws 403 | Authorization failure beyond auth check |
| `conflict(msg)` | throws 409 | Conflicting resource state |

#### Complete canonical example

```ts
import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { myModule } from "@/lib/container";
import { presentMyEntity } from "@/modules/my-module";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import { parseCreateMyEntityRequest } from "./validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    myModule.bindRequest(supabase);
    const entities = await myModule.listEntities.execute(user.id);
    return ok(entities.map(presentMyEntity));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseCreateMyEntityRequest(body);
    if (!parsed.ok) return errorResponse(parsed.error);

    myModule.bindRequest(supabase);
    const entity = await myModule.createEntity.execute({ userId: user.id, ...parsed.value });
    return created(presentMyEntity(entity));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

### When adding features to a migrated module

1. Add the domain type/error if needed.
2. Extend the repository interface if the use case needs new data access.
3. Implement the repository method in the Supabase infrastructure class (must implement `SupabaseAware` with `bindRequest`).
4. Create a new use case class.
5. Wire it in the module factory (`<module>.module.ts`).
6. If a new repository was added, include it in the module's `bindRequest` method.
7. Call it from the route handler via `analysisChatModule.<useCase>.execute(...)` (importing from `src/lib/container.ts`).
8. Record observability events via the `EventTracker` in the use case.

### When migrating a new module

Follow the `analysis-chat` module as the reference pattern for the singleton/`bindRequest` architecture. Steps:

1. Create domain layer (entities, VOs, errors, repository ports).
2. Create infrastructure repositories implementing both the domain port and `SupabaseAware`. Constructors take no parameters; the Supabase client is received via `bindRequest`.
3. Create use cases with constructor injection of repository singletons.
4. Create the module factory (`<module>.module.ts`): instantiate repos and use cases at module level; export a `create<Module>Module()` function that returns use cases plus a `bindRequest` method that delegates to all repositories.
5. Register the module in `src/lib/container.ts` — this is the only place where modules are instantiated.
6. Switchover route handlers: import from `src/lib/container.ts`, call `module.bindRequest(supabase)` per request.
7. Clean up `db.ts` functions only after routes no longer use them.

Each step should be a separate commit.

### Testing conventions

- **Domain layer:** Aggregate roots and value objects must have colocated tests. Test `create`, `fromPrimitives`, `toPrimitives`, validation, domain methods, and recorded events. Domain services with logic also need colocated tests.
- **Infrastructure layer:** Backend tests (`*.test.ts`) against real Supabase E2E stack (ports 56431+). Test each repository method. One test user per test via `createConfirmedUser()`. Repositories are instantiated without arguments and configured with `repo.bindRequest(supabase)` before use.
- **Application layer:** Backend tests with real repositories against real DB. Mock only external services (AI) and cross-cutting concerns (EventTracker). Test happy paths, domain error cases, and orchestration logic.
- **No mocks for database** — all DB interactions use the real Supabase E2E instance.
- **Never test AI services directly** — AI service implementations must not be exercised in automated tests. Use mocks injected into use cases whenever AI behavior is required.
- Run with `npm run test:backend` (auto-starts Supabase E2E stack if not running).
- Test files live next to the code they test and share the source filename plus `.test.ts`: `create-context.use-case.ts` → `create-context.use-case.test.ts`, `supabase-work-journal-entry.repository.ts` → `supabase-work-journal-entry.repository.test.ts`.
- Run `npm run ddd:check` before finishing changes under `src/modules/`. It runs:
  - `scripts/verify-ddd-tests.mjs`: every `src/modules/**/application/use-cases/*.use-case.ts` and every `src/modules/**/infrastructure/repositories/*.repository.ts` must have a colocated `*.test.ts` file with the same basename.
  - `scripts/verify-ddd-imports.mjs`: module internals must respect DDD import direction. Domain cannot import application or infrastructure, application cannot import infrastructure, infrastructure cannot import application, and feature modules cannot import another feature module's internal paths. Barrel imports (`@/modules/<name>`) across modules are allowed for cross-module query dispatch via QueryBus. Composition roots (`<module>.module.ts`), module barrels, tests, test helpers, external packages, and `src/modules/shared/**` are allowed where appropriate.
  - `scripts/verify-ddd-entities.mjs`: modules listed in `migratedModules` must follow the AggregateRoot/ValueObject/repository rules above.
  - `scripts/verify-ddd-route-imports.mjs`: files under `src/app/`, `src/components/`, and `src/lib/` that import from `@/modules/<name>` must use the barrel (`@/modules/<name>` or `@/modules/<name>/index`), never reach into internal paths like `@/modules/<name>/infrastructure/...`. `@/modules/shared` is exempt.
  - `scripts/verify-ddd-barrel-exports.mjs`: module barrel files (`index.ts`) must not re-export from `infrastructure/` or from `domain/repositories/`. Infrastructure details must be accessed through use cases, and repository port interfaces are module-internal (consumers use them via relative/alias imports within the same module). `@/modules/shared` is exempt.

### Re-export shims in `src/lib/`

Some `src/lib/` files are thin re-export shims that bridge old import paths to domain files inside modules (e.g., `src/lib/cv-profile.ts` → `@/modules/cv-library/domain/cv-profile`). These shims **must import from the domain file directly**, not from the module barrel (`@/modules/<name>`), because the barrel re-exports the full module (use cases, repositories, etc.) and Next.js Turbopack does not tree-shake barrel re-exports in client components — importing the barrel from a client component drags in `server-only` code and breaks the build. These shim files are listed in the `reExportShims` set in `scripts/verify-ddd-route-imports.mjs` so they are exempt from the barrel-only rule.

### Build verification

After any change under `src/modules/`, `src/lib/`, `src/app/`, or `src/components/`, run `npm run build` before finishing. Type-checking alone (`tsc --noEmit`) does not catch Next.js server/client boundary errors — only the full build does.

## Agent Workflow Preferences
- **Commits:** Do not make commits automatically. Always leave any changes uncommitted so the user can review them manually before committing.

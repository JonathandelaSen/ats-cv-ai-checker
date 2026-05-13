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
- **AI prompts** stay in `src/lib/ai-*-prompts.ts` — the infrastructure service imports them.
- **Cross-module dependencies** use minimal port interfaces (e.g., `CVDataRepository` exposes only what the consuming module needs).
- **`getAuthedSupabase()`** and `validation.ts` helpers stay in the route handler layer, not in the module.

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
  - `scripts/verify-ddd-imports.mjs`: module internals must respect DDD import direction. Domain cannot import application or infrastructure, application cannot import infrastructure, infrastructure cannot import application, and feature modules cannot import another feature module's internals. Composition roots (`<module>.module.ts`), module barrels, tests, test helpers, external packages, and `src/modules/shared/**` are allowed where appropriate.
  - `scripts/verify-ddd-entities.mjs`: modules listed in `migratedModules` must follow the AggregateRoot/ValueObject/repository rules above.

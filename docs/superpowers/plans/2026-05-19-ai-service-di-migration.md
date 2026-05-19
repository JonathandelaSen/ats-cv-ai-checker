# AI service DI migration plan

## Goal

Migrate every AI-backed flow to the provider-aware factory pattern described in `docs/architecture/ai-service-dependency-injection.md`.

The migration covers backend contracts, frontend AI settings, official mock providers, observability metadata, tests, and architecture verification.

Do not call real AI providers during this migration.

## Scope

Migrate all current AI capabilities:

- `cv-library`: CV profile structuring and editing
- `cv-analysis`: CV scoring
- `job-match-analysis`: job match scoring
- `work-journal`: journal draft generation
- `feedback-notes`: final feedback generation
- `analysis-chat`: analysis chat answers
- `selection-process`: interview answer generation and editing

Frontend is in scope because the HTTP contract changes from provider-specific fields to `provider`, `apiKey`, and `model` with no fallback.

Database persistence of `aiProvider` is out of scope unless a touched flow can add it without schema work. Plan it as a later schema migration where needed.

## Decisions already made

- `provider` is explicit and must not be inferred from `model`.
- `AIProvider` is a shared closed union, initially `gemini | mock`.
- Each AI capability has its own provider-aware factory.
- Provider-aware factories receive provider-specific factories via constructor injection.
- Module composition roots inject provider-aware factories, never provider-specific factories.
- Use cases receive domain factory ports when provider/model/API key vary per request.
- `model` is required for every provider, including `mock`.
- `apiKey` is optional for `mock` and required for real providers.
- Tests must throw if a real provider is requested.
- Production must throw if `mock` is requested.
- Development allows both `mock` and real providers.
- HTTP/API/frontend contracts use `provider`, `apiKey`, and `model`. Do not keep a `geminiApiKey` fallback.
- Official mock providers return deterministic, valid, clearly marked mock output.
- Observability metadata for AI actions includes `provider` and `model`.
- Add strict architecture verification with no allowlist.

## Phase 1: shared provider primitives and runtime guard

Add shared provider types and runtime policy.

Suggested files:

- `src/modules/shared/domain/value-objects/ai-provider.value-object.ts` or a shared domain type if a VO is heavier than needed
- `src/modules/shared/infrastructure/ai-provider-runtime-guard.ts`
- shared exports from `src/modules/shared/index.ts` only if frontend-safe boundaries are respected

Implement:

- `AIProvider = "gemini" | "mock"`
- provider parser/validator for HTTP validation
- `assertAIProviderAllowedForRuntime(provider: AIProvider): void`
- controlled errors:
  - unknown provider: 400
  - unsupported provider for capability: 400
  - missing API key for real provider: 400
  - provider blocked by runtime: 403

Be careful with frontend imports. Frontend code must not import from `@/modules/**`; expose frontend-safe duplicated type or API response/request types where needed.

## Phase 2: migrate AI factory ports

For every domain AI service file, add or update the factory port.

Expected shape:

```ts
export interface SomeAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): SomeAIService;
}
```

Add factory ports where services currently lack them:

- `analysis-chat/domain/repositories/analysis-chat-ai-service.repository.ts`
- `selection-process/domain/repositories/interview-question-ai.service.ts`
- `work-journal/domain/repositories/journal-ai-service.repository.ts`
- `feedback-notes/domain/repositories/feedback-ai-service.repository.ts`

Update use-case inputs to include `provider`, `apiKey?`, and `model`.

## Phase 3: provider-specific and mock factories

For each capability:

1. Keep or create a Gemini provider-specific factory.
2. Add a mock provider-specific factory.
3. Add a provider-aware factory that implements the domain factory port.

Suggested naming:

- `gemini-*-ai.service.ts`
- `mock-*-ai.service.ts`
- `provider-*-ai-service.factory.ts`

Provider-aware factories must call `assertAIProviderAllowedForRuntime(provider)` before selecting a provider.

Gemini factories must validate `apiKey` before creating the Gemini service.

Mock factories should ignore `apiKey`, require `model`, and return deterministic outputs marked with `[mock-ai]`.

## Phase 4: module composition roots

Update each module factory:

- instantiate provider-specific factories
- instantiate provider-aware factory with constructor injection
- inject provider-aware factory into use cases
- remove dynamic module methods such as `createDraftEntryUseCase(aiConfig)` and `createGenerateFinalFeedbackUseCase(aiConfig)`

Target modules:

- `src/modules/cv-library/cv-library.module.ts`
- `src/modules/cv-analysis/cv-analysis.module.ts`
- `src/modules/job-match-analysis/job-match-analysis.module.ts`
- `src/modules/work-journal/work-journal.module.ts`
- `src/modules/feedback-notes/feedback-notes.module.ts`
- `src/modules/analysis-chat/analysis-chat.module.ts`
- `src/modules/selection-process/selection-process.module.ts`

Use cases should call `this.deps.aiFactory.create({ provider, apiKey, model })` inside `execute`.

## Phase 5: HTTP validation and route contracts

Update every AI route validation contract to require `provider` and `model`, and require `apiKey` for real providers.

Remove `geminiApiKey` from validation outputs and route calls. Do not accept it as fallback.

Known route areas:

- `src/app/api/cvs/**`
- `src/app/api/cv-analyses/**`
- `src/app/api/job-match-analyses/**`
- `src/app/api/work-journal/**`
- `src/app/api/feedback-notes/**`
- `src/app/api/interview-questions/**`

Keep route anatomy rules:

- `getAuthenticatedRequestContext()` first in `try`
- validate before `bindRequest`
- bind modules before use cases
- use shared response helpers
- `handleApiError` in `catch`

## Phase 6: frontend AI settings

Replace provider-specific browser preference helpers:

- `getStoredGeminiApiKey`
- `saveStoredGeminiApiKey`
- `removeStoredGeminiApiKey`
- `hasStoredGeminiApiKey`

with provider-agnostic settings:

- `getStoredAIProvider`
- `getStoredAIApiKey`
- `getStoredAIModel`
- `saveStoredAISettings`
- matching remove/has helpers as needed

Do not migrate old local-storage keys or keep fallback behavior. Users may need to re-enter their key.

Update all frontend API clients and components to send:

```ts
{
  provider,
  apiKey,
  model,
}
```

Use the global AI settings as the single source of truth. Show `mock` only outside production.

Update user-facing messages so they say "proveedor de IA" unless they truly refer to Gemini specifically.

## Phase 7: observability

For every AI-backed backend action touched by the migration, include `provider` and `model` in observability metadata.

Do this in use cases when the use case records events. If a route currently records the event, preserve behavior but include the provider/model until that route is later moved deeper into the module.

## Phase 8: verification script

Create `scripts/verify-ai-service-di.mjs` and add it to `scripts/verify-ddd.mjs`.

Checks should fail when:

- domain `*AIServiceFactory` ports do not include `provider` in `create(...)`
- `*.module.ts` injects provider-specific factories such as `Gemini*AIServiceFactory` directly into use cases
- `Provider*AIServiceFactory` files do not call `assertAIProviderAllowedForRuntime`
- automated tests or test helpers import real provider SDKs or services
- migrated AI validation/frontend settings still use `geminiApiKey`

Use no allowlist. Make the repo comply before enabling the script.

## Phase 9: tests

Update use-case unit tests to use either inline factory mocks or official mock providers.

Add provider-aware factory tests for every capability:

- selects Gemini for `provider: "gemini"` in non-test runtime
- selects mock for `provider: "mock"` in test/development
- throws for Gemini in automated test runtime
- throws for mock in production runtime
- throws 400 for unsupported providers where applicable
- throws 400 for missing API key in real provider factory

Do not test real AI services directly and do not call real AI APIs.

Run:

```bash
npm run test:backend
npm run ddd:check
npm run build
```

Build is required because this migration touches `src/modules/`, `src/app/`, `src/components/`, `src/features/`, `src/frontend/`, and `src/lib/`.

## Suggested commit slices

The user prefers uncommitted changes by default, but if commits are requested later, use these slices:

1. Shared AI provider type, runtime guard, and controlled errors.
2. Backend domain factory ports, provider-aware factories, and mock providers.
3. Module/use-case migration for all AI capabilities.
4. HTTP validation and route contract migration.
5. Frontend AI settings and payload migration.
6. Observability metadata updates.
7. Architecture verification script.
8. Tests and docs cleanup.

Do not push to `main`.

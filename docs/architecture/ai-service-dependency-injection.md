# AI service dependency injection

## Purpose

AI services are runtime-selected dependencies. The frontend can send different providers, models, and API keys per request, and automated tests must never accidentally call paid providers.

The architecture therefore uses provider-aware factories as the single dependency inversion pattern for AI services.

## Rules

Use cases depend on domain-layer ports. They must not import infrastructure services or instantiate SDK clients.

When an AI implementation depends on runtime configuration, the use case receives a domain factory port:

```ts
export interface CVProfileStructuringAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): CVProfileStructuringAIService;
}
```

`provider` is explicit. Do not infer the provider from `model`.

`model` is always required, including for `mock`, so generated records and observability keep clear model provenance.

`apiKey` is optional at the type level because `mock` does not need credentials. Provider-specific real factories must reject missing credentials with a controlled 400 error.

## Provider-aware factory

Each AI capability has its own provider-aware factory. Do not create one global stringly typed AI factory.

Examples:

- `ProviderCVProfileStructuringAIServiceFactory`
- `ProviderCVProfileEditingAIServiceFactory`
- `ProviderCVScoringAIServiceFactory`
- `ProviderJobMatchScoringAIServiceFactory`
- `ProviderAnalysisChatAIServiceFactory`
- `ProviderInterviewQuestionAIServiceFactory`
- `ProviderJournalAIServiceFactory`
- `ProviderFeedbackAIServiceFactory`

Provider-aware factories live in the module infrastructure layer and implement the domain factory port. They receive provider-specific factories through constructor injection:

```ts
const profileStructuringAI = new ProviderCVProfileStructuringAIServiceFactory({
  geminiFactory: new GeminiCVProfileStructuringAIServiceFactory(),
  mockFactory: new MockCVProfileStructuringAIServiceFactory(),
});
```

The provider-aware factory must:

1. Validate runtime policy with `assertAIProviderAllowedForRuntime(provider)`.
2. Select a provider-specific factory for the requested provider.
3. Throw a controlled 400 error for providers that are known globally but unsupported by this capability.
4. Delegate service creation to the provider-specific factory.

Module composition roots inject provider-aware factories into use cases. They must not inject provider-specific factories directly.

## Provider-specific factories

Provider-specific factories create configured services for one provider only:

```ts
export class GeminiCVProfileStructuringAIServiceFactory {
  create(config: { apiKey?: string; model: string }) {
    if (!config.apiKey) throw badRequest("API key is required for Gemini.");
    return new GeminiCVProfileStructuringAIService({
      apiKey: config.apiKey,
      model: config.model,
    });
  }
}
```

They do not decide whether the provider is allowed in the current runtime. That policy belongs to the provider-aware factory.

## Runtime guard

Shared infrastructure owns runtime policy because it depends on environment state.

Required policy:

- `test`: only `mock` is allowed.
- `development`: `mock` and real providers are allowed.
- `production`: real providers are allowed; `mock` is forbidden.

Use one shared guard:

```ts
assertAIProviderAllowedForRuntime(provider);
```

The guard should raise controlled API errors:

- unknown provider or unsupported provider for capability: 400
- missing API key for a real provider: 400
- provider blocked by runtime policy: 403

## Mock providers

Every migrated AI capability needs an official mock provider implementation under its infrastructure services.

Mock outputs must be:

- deterministic
- valid for the capability response shape
- clearly marked as mock output, for example with `[mock-ai]`
- safe for local development, automated tests, and end-to-end flows

Use-case unit tests may still use small inline mocks when testing use-case orchestration.

## HTTP and frontend contracts

AI HTTP payloads must use provider-agnostic names:

```ts
{
  "provider": "gemini",
  "apiKey": "...",
  "model": "gemini-3.1-pro-preview"
}
```

Do not add fallback compatibility for provider-specific names such as `geminiApiKey` when migrating a route. Missing `provider`, `apiKey` for a real provider, or `model` should be validation errors.

Frontend AI settings should have one global source of truth:

- `provider`
- `apiKey`
- `model`

The `mock` provider should be visible in development UI only. Production UI should not offer it, and backend policy must reject it anyway.

## Observability

All AI-backed backend actions must record `provider` and `model` in observability metadata when the action is created or edited.

Persisting `aiProvider` beside existing `aiModel` fields is desirable, but it is a separate schema migration phase when it requires database changes. This DI migration must pass `provider` through requests, use cases, factories, and observability even before persistence is expanded.

## Verification

Add `scripts/verify-ai-service-di.mjs` and wire it into `scripts/verify-ddd.mjs` after the migration is complete.

The script should fail when:

- a domain `*AIServiceFactory` port has a `create(...)` contract without `provider`
- a `*.module.ts` injects `new Gemini*AIServiceFactory()` or another provider-specific factory directly into a use case
- a provider-aware factory does not call `assertAIProviderAllowedForRuntime`
- automated test files or test helpers import real provider services or SDKs such as `@google/genai`
- migrated API validation or frontend AI settings still use provider-specific names such as `geminiApiKey`

No allowlist should be used. The migration is small enough to make the repository comply in one pass before enabling the check.

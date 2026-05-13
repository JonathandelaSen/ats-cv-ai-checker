# DDD module map and migration status

## Purpose

This document is the working reference for the progressive migration from `src/lib/db.ts` to DDD modules under `src/modules/`.

It records the target module boundaries, aggregate names, ownership rules, migration status, and known trade-offs. It is meant for both humans and agents before starting new migration work.

## Global conventions

- Domain models use camelCase. Database rows and HTTP payloads may use snake_case at the boundary.
- Modules expose behavior through use cases and presenters; route handlers stay responsible for HTTP auth, request parsing, and payload normalization.
- Cross-module dependencies must use minimal port interfaces. A module must not import another feature module's internals.
- Cross-module reads use the shared query bus. Queries always represent read use cases and must follow the same naming pattern as the use case they execute.
- AI prompt builders/system instructions stay in prompt-only modules. Controllers/services that call model APIs import prompts instead of defining prompts inline.
- New or edited platform actions with backend interaction must be recorded in observability.
- Production Supabase migrations are not applied by agents unless explicitly requested in the same turn.

## Cross-module query bus

Use cases may depend on a shared `QueryBus` when they need to read data owned by another module.

The query bus is not a shortcut to repositories. A query is the public CQRS entrypoint for a read use case.

Rules:

- Queries always represent read use cases.
- Query names and handler names must mirror the use case they execute.
- Query handlers execute the corresponding use case; they should not contain independent business logic.
- Query handlers live in the module that owns the data/behavior.
- Modules expose their public queries from a clear public API point, such as the module `index.ts`.
- Each module composition root decides which query handlers it registers.
- Executing an unregistered query must fail with a clear error.
- A query may return an aggregate, primitives, or a read model depending on the use case contract.
- Consumer modules may import public query classes/types, but must not import another module's infrastructure repositories or internal use-case files directly.

Example shape:

```ts
class GetJobMatchAnalysisByIdQueryHandler {
  constructor(private readonly useCase: GetJobMatchAnalysisByIdUseCase) {}

  async handle(query: GetJobMatchAnalysisByIdQuery) {
    return this.useCase.execute(query.payload);
  }
}
```

Example consumer:

```ts
const analysis = await this.queryBus.execute(
  new GetJobMatchAnalysisByIdQuery({
    id: input.analysisId,
    userId: input.userId,
  })
);
```

This lets a use case in `analysis-chat` obtain a `JobMatchAnalysis` aggregate from `job-match-analysis` without importing the other module's repository or querying its tables directly.

## Current migration status

### Fully active DDD reference

#### `work-journal`

Status: migrated and currently listed in `scripts/verify-ddd-entities.mjs`.

Purpose: private work/project journal with AI-assisted drafting.

Main aggregates:

- `JournalContext`
- `JournalEntry`

Notes:

- This is the reference pattern for migrated modules.
- It includes repository ports, Supabase repositories, use cases, presenters, observability, and colocated tests.

### Existing DDD-style modules not part of this planning pass

These modules already exist under `src/modules/`, but this document does not decide whether to harden or verify them next.

#### `received-feedback`

Purpose: feedback received from other people.

Current state:

- Has entities, value objects, repository, use cases, presenter, routes, observability, and tests.

#### `feedback-notes`

Purpose: preparing final feedback from notes about a person.

Current state:

- Has DDD-style structure, AI service, use cases, routes, observability, and tests.
- Some naming and repository conventions may still differ from the strict `work-journal` pattern.

#### `commitments`

Purpose: objectives/commitments tracking.

Current state:

- Has DDD-style structure, several aggregates, routes, observability, and tests.
- This module was not included in the new-boundary discussion.

## Target module map

### `cv-library`

Purpose: own the user's CV assets and structured CV profiles.

Aggregates:

- `CVDocument`
- `CVStructuredProfile`

Responsibilities:

- Store uploaded/template CV documents.
- Own CV document metadata: name, filename, file size, storage path, type, source document, template metadata, extracted text, timestamps.
- Own public CV publishing fields on `CVDocument`: enabled flag, public id, slug, published timestamp.
- Own the user's structured CV profiles as first-class aggregates.
- Support multiple structured profiles per user. Different profiles may represent variants of a CV for different target roles.

Important decisions:

- Use `CVDocument`, not just `CV`, to distinguish the document/source artifact from `CVStructuredProfile`.
- `CVStructuredProfile` is core domain, not a technical detail of PDF extraction.
- `CVStructuredProfile` may reference a source document, but it should be treated as an aggregate with its own lifecycle.
- CV template/version data stays as metadata for now, not a separate aggregate.
- Publishing starts as behavior on `CVDocument`, not a separate `PublishedCV` aggregate.

Likely owned tables:

- Current/legacy: `cvs`, `cv_structured_profiles`, possibly `cv_template_versions`.
- Final names may change during migration, but this module owns their semantics.

Used by:

- `cv-analysis`
- `job-match-analysis`
- `selection-process`
- public CV routes

Suggested ports for other modules:

- `CVDocumentReader`
- `CVStructuredProfileReader`
- `PublicCVReader`

### `cv-analysis`

Purpose: analyze a CV on its own, independent of a job offer.

Aggregate:

- `CVAnalysis`

Responsibilities:

- Store a general analysis result for a CV/profile.
- Own result fields specific to general CV analysis.
- Reference the input CV document/profile used for the analysis.

Important decisions:

- This is separate from `job-match-analysis`, even though the current legacy table mixes both with `analysis_mode`.
- The split is based on domain meaning and future result shape, not current shared persistence.
- It should have its own table, repository, use cases, and result model.

Likely references:

- `cvDocumentId`
- `cvStructuredProfileId`

Migration notes:

- Rows from legacy `analyses` where `analysis_mode = 'general'` should migrate here.
- Existing UI/read models may temporarily keep an `/api/analyses` compatibility facade while the internal model splits.

### `job-match-analysis`

Purpose: compare a CV/profile against a job opportunity.

Aggregate:

- `JobMatchAnalysis`

Responsibilities:

- Store comparison results between a CV/profile and a job opportunity.
- Own scoring, feedback, matching/missing keywords, and comparison-specific outputs.
- Reference the job opportunity when available.
- Store a job snapshot used at analysis time for reproducibility.

Important decisions:

- This is separate from `cv-analysis`.
- It should have its own table and migration from legacy `analyses`.
- It should not be the owner of follow-up state.
- It may create or consume a `JobOpportunity`, but the opportunity belongs to `selection-process`.

Likely references:

- `cvDocumentId`
- `cvStructuredProfileId`
- `jobOpportunityId`

Required snapshot:

- Job description
- Job URL
- Extracted job key data used during the analysis

Migration notes:

- Rows from legacy `analyses` where `analysis_mode = 'job_match'` should migrate here.
- Current offer tracking fields on `analyses` should move to `selection-process` as `FollowUp`.
- Current `job_description`, `job_url`, and `job_key_data` should help create/migrate `JobOpportunity` plus an analysis snapshot.

### `selection-process`

Purpose: own the user's job opportunities and selection-process state.

Aggregates:

- `JobOpportunity`
- `FollowUp`
- `ProcessQuestion`

#### `JobOpportunity`

Represents a job opportunity or selection process target.

Responsibilities:

- Store job description, URL, and normalized job key data.
- Exist independently from analysis and follow-up.
- Be reusable across multiple job-match analyses and follow-up state.

Important decisions:

- A `JobOpportunity` can exist without a `FollowUp`.
- A `JobOpportunity` can exist before or after a `JobMatchAnalysis`.
- `job_key_data` belongs primarily here when it describes the offer.
- `JobMatchAnalysis` stores a snapshot of the opportunity data used for that run.

#### `FollowUp`

Represents the user's operational tracking for a job opportunity.

Responsibilities:

- Store status, notes, next action, next action date.
- Track the user's process state for a `JobOpportunity`.

Important decisions:

- The aggregate name is `FollowUp`.
- It belongs inside `selection-process`.
- It is 1:1 per user and `JobOpportunity`.
- It primarily references `JobOpportunity`.
- It may keep a source/origin reference to a migrated `JobMatchAnalysis` for traceability.
- It replaces the current offer tracking fields on legacy `analyses`: `offer_status`, `offer_notes`, `offer_next_action`, `offer_next_action_at`.

#### `ProcessQuestion`

Represents a question that belongs to a selection process.

Responsibilities:

- Store process questions and prepared answers.
- Support questions that happen before, during, or after interviews.
- Keep association with the relevant `JobOpportunity`.

Important decisions:

- Existing interview-question behavior should migrate here, but the domain name should not be `InterviewQuestion`.
- These questions are only for the selection process. Future unrelated question types should be their own aggregates in their own modules.
- `ProcessQuestion` hangs from `JobOpportunity`.
- It does not domain-link directly to `CVDocument` or `CVStructuredProfile`.
- It may keep a source/origin reference to `JobMatchAnalysis` when created from an analysis screen.

Likely owned tables:

- New/final tables for job opportunities, follow-ups, and process questions.
- Legacy source: `interview_questions` and offer tracking fields on `analyses`.

### `analysis-chat`

Purpose: conversations over analysis context.

Aggregates:

- `Conversation`
- `ChatMessage`

Responsibilities:

- Store analysis chat conversations and messages.
- Generate assistant responses using an analysis context.
- Remain separate from `selection-process` even if the UI currently shows it under a job-offer analysis tab.

Important decisions:

- This is a separate module.
- It depends on analyses through ports, not direct imports.
- It should support being attached to analysis contexts without owning the analysis result.

Open design point:

- Decide whether `analysis-chat` supports both `cv-analysis` and `job-match-analysis`, or only `job-match-analysis` at first.

Likely owned tables:

- Current/legacy: `analysis_chat_conversations`, `analysis_chat_messages`.

Suggested ports:

- `AnalysisContextReader`, with implementations for the relevant analysis modules.

## Shared value objects and technical capabilities

### Document extraction

Document extraction is not a domain module by itself for now.

The extraction process is a technical capability, but its input and output should be modeled.

Suggested shared VOs:

- `DocumentInput`
- `ExtractedDocumentText`

`DocumentInput` may include:

- filename
- file size
- storage path
- MIME/type/origin if needed

`ExtractedDocumentText` may include:

- text from Python parser
- text from PDF.js parser
- text from Node parser
- extractor errors
- preferred/normalized text if added later

Ownership:

- The capability lives in infrastructure/services.
- The persisted input/output belongs to the aggregate that stores it, such as `CVDocument`, `CVAnalysis`, or `JobMatchAnalysis`.

## Compatibility and migration strategy

### Keep behavior stable

The migration should not intentionally change product behavior.

Specific preserved behavior:

- Uploading a PDF for a new analysis still saves it in the CV library.
- Existing views can keep their current navigation while internal modules are split.

### Temporary `analyses` facade

Recommendation: keep a temporary `/api/analyses` facade/read model while splitting the underlying domain.

Purpose:

- Let the sidebar and current analysis screens continue to load a unified list.
- Avoid coupling the domain split to a full UI redesign.
- Allow `cv-analysis` and `job-match-analysis` to migrate incrementally.

The facade can merge summaries from:

- `cv-analysis`
- `job-match-analysis`

It should be treated as compatibility/read-model code, not as a domain module.

### Data migration implications

Splitting legacy `analyses` requires migration scripts/files for:

- `cv_analyses`
- `job_match_analyses`
- `job_opportunities`
- `follow_ups`
- updated process question references
- updated analysis chat references
- updated observability references or polymorphic event fields

Known legacy references that need attention:

- `interview_questions.analysis_id`
- `analysis_chat_conversations.analysis_id`
- `analysis_chat_messages.analysis_id`
- `processing_events.analysis_id`
- routes under `/api/analyses`
- components and types importing from `@/lib/db`

Potential strategy:

1. Create new module files and tables locally.
2. Backfill from legacy tables.
3. Add compatibility routes/read models.
4. Switch route handlers to modules.
5. Migrate UI references away from `@/lib/db` types.
6. Clean up `src/lib/db.ts` functions only after routes no longer use them.

## Non-goals for the next migration decision

Do not spend the next module-boundary decision on:

- hardening existing DDD-style modules against the strict verifier
- redesigning the UI navigation
- creating a `document-extraction` domain module
- creating a separate `templates` module
- applying production migrations

## Candidate next migration slices

### Lower-risk slice: `analysis-chat`

Pros:

- Clear tables and behavior.
- Smaller than splitting `analyses`.
- Forces the design of analysis context ports.

Cons:

- Needs a decision about polymorphic references to `cv-analysis` and `job-match-analysis`.
- If migrated before analysis split, may need a second migration later.

### Medium-risk slice: `selection-process.ProcessQuestion`

Pros:

- Replaces `interview_questions` with the agreed domain language.
- Good place to introduce `JobOpportunity` gradually.
- Smaller than full analysis split.

Cons:

- Existing records reference legacy `analyses`.
- Requires mapping old `cv_id`/`analysis_id` semantics into process-oriented links.

### Higher-risk slice: `selection-process` with `JobOpportunity` and `FollowUp`

Pros:

- Removes offer tracking from legacy `analyses`.
- Establishes the core model needed by `job-match-analysis`.

Cons:

- Requires backfill from `analyses`.
- Touches sidebar summaries, analysis detail screens, and offer tracking UI.

### Highest-risk slice: split `analyses`

Pros:

- Resolves the biggest domain mismatch.
- Enables independent evolution of CV analysis and job-match analysis.

Cons:

- Requires new tables, backfill, compatibility facade, route changes, UI types, chat references, process questions, and observability references.

## Open questions

- Should `analysis-chat` initially support both `cv-analysis` and `job-match-analysis`, or only `job-match-analysis`?
- What should the final table names be for `cv-analysis` and `job-match-analysis`?
- Should observability keep one `analysis_id`, or move to typed references such as `{ subjectType, subjectId }`?
- During migration, should old analysis IDs be preserved as IDs in new tables, or stored as `legacyAnalysisId`?
- Should `JobOpportunity` be created for every migrated `job_match` row, or only rows with job URL/description/key data?

# CV Library DDD Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move CV document and structured profile behavior from `src/lib/db.ts` into a `src/modules/cv-library` vertical slice while preserving existing API response shapes.

**Architecture:** Keep the existing `cvs` and `cv_structured_profiles` tables. Add `CVDocument` and `CVStructuredProfile` aggregates, Supabase repositories that map database snake_case to domain camelCase, application use cases with observability where writes occur, compatibility presenters, and route integration through the singleton container.

**Tech Stack:** Next.js route handlers, Supabase, Vitest, TypeScript, existing shared DDD value objects and `BoundSupabaseRepository`.

---

### Task 1: Domain Model

**Files:**
- Create: `src/modules/cv-library/domain/entities/cv-document.entity.ts`
- Create: `src/modules/cv-library/domain/entities/cv-structured-profile.entity.ts`
- Create: `src/modules/cv-library/domain/value-objects/*.value-object.ts`
- Test: colocated `*.test.ts` files

- [ ] Write failing tests for document/profile creation, primitive hydration, updates, public settings, and validation.
- [ ] Implement minimal aggregates and value objects.
- [ ] Run domain tests and keep them green.

### Task 2: Ports, Use Cases, Presenters

**Files:**
- Create: `src/modules/cv-library/domain/repositories/*.repository.ts`
- Create: `src/modules/cv-library/application/use-cases/*.use-case.ts`
- Create: `src/modules/cv-library/application/presenters/cv-library-presenters.ts`
- Test: colocated use-case tests

- [ ] Write failing use-case tests with in-memory repository fakes.
- [ ] Implement list/get/create/update/delete/profile use cases.
- [ ] Add observability events for write actions.
- [ ] Keep presenter output compatible with current `@/lib/db` CV shapes.

### Task 3: Supabase Infrastructure

**Files:**
- Create: `src/modules/cv-library/infrastructure/repositories/supabase-cv-document.repository.ts`
- Create: `src/modules/cv-library/infrastructure/repositories/supabase-cv-structured-profile.repository.ts`
- Test: colocated backend tests

- [ ] Write failing repository tests against the real backend stack.
- [ ] Implement Supabase repositories with `bindRequest`.
- [ ] Keep storage deletion for uploaded CVs behind the document repository.

### Task 4: Module Wiring and Routes

**Files:**
- Create: `src/modules/cv-library/cv-library.module.ts`
- Create: `src/modules/cv-library/index.ts`
- Modify: `src/lib/container.ts`
- Modify: CV route handlers under `src/app/api/cvs/**`, public CV page/PDF route, and `src/app/api/parse/route.ts`

- [ ] Wire a singleton module in the container.
- [ ] Bind the request Supabase client in each migrated route.
- [ ] Replace direct CV helper calls with use cases and presenters.
- [ ] Preserve current route status codes and JSON shapes.

### Task 5: Verification

**Files:**
- Modify: none unless verification exposes gaps.

- [ ] Run targeted `cv-library` tests.
- [ ] Run `npm run ddd:check`.
- [ ] Run `npm run test:backend`.
- [ ] Confirm no migrated CV route imports `@/lib/db` for CV helpers.

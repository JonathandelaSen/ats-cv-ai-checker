# ATS CV AI Checker

This context defines the product language for career-development records, reflections, and AI-assisted CV workflows.

## Language

**Activity Context**:
A named professional or personal-professional sphere that related records can be attached to.
_Avoid_: Work Context, Journal Context, Commitment Context, context

**Activity Context Reuse**:
The user decides whether a new real-world stage deserves a new **Activity Context** or should continue under an existing one.
_Avoid_: Automatic splitting, forced deduplication

**Employment Activity Context**:
An **Activity Context** for a job, employer, client, or employment-like relationship.
_Avoid_: Job-only context

**Project Activity Context**:
An **Activity Context** for a concrete initiative with its own identity.
_Avoid_: Treating every employer as a project

**Personal Activity Context**:
An **Activity Context** for self-directed professional activity such as learning, portfolio work, career search, or side work.
_Avoid_: Private-life context

**Other Activity Context**:
An **Activity Context** used when the user does not want to classify the sphere as employment, project, or personal.
_Avoid_: Miscellaneous business logic category

**General Activity Context**:
The default **Other Activity Context** used as a neutral place for records the user has not attached to a more specific sphere.
_Avoid_: Most important context, personal context, inbox

**Archived Activity Context**:
An **Activity Context** kept for historical records after the user no longer wants to use it for new records.
_Avoid_: Deleted context

**Deleted Activity Context**:
An **Activity Context** removed by the user after its existing records are moved to the **General Activity Context**.
_Avoid_: Deleting records with the context

## Relationships

- An **Activity Context** can have zero or more journal entries.
- An **Activity Context** can have zero or more commitments.
- An **Activity Context** can have zero or more received feedback records.
- Two **Activity Contexts** may share the same visible name when the user wants to distinguish separate stages or relationships.
- Each user has one **General Activity Context** by default.
- Records without a user-chosen sphere belong to the user's **General Activity Context**.
- An **Archived Activity Context** can keep existing records attached to it.
- Received feedback without a user-chosen sphere belongs to the user's **General Activity Context**.
- Users can disambiguate similar **Activity Contexts** through the name itself.
- Deleting an **Activity Context** moves its existing records to the user's **General Activity Context**.
- The **General Activity Context** cannot be deleted.

## Example dialogue

> **Dev:** "Should received feedback create its own project list?"
> **Domain expert:** "No, received feedback should attach to an existing **Activity Context** so the same sphere can be used by journal entries and commitments."

## Flagged ambiguities

- "context" is overloaded between user activity grouping, AI prompt context, and analysis/chat context; resolved: the reusable user grouping is **Activity Context**.

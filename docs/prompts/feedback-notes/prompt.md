# Feedback Notes Prompt

## Current Prompt

System prompt source: `src/modules/feedback-notes/infrastructure/services/feedback-notes-prompts.ts`

The system prompt tells the model to turn private raw feedback notes into useful peer feedback, write in the same language as the notes, use only the provided notes, avoid invented facts, preserve uncertainty, and return JSON only.

The user prompt includes:

- the target `personName`
- all feedback entries ordered chronologically
- each entry's creation timestamp and content
- the required JSON response shape with `final_feedback`

## Source Files

- Prompt builder: `src/modules/feedback-notes/infrastructure/services/feedback-notes-prompts.ts`
- AI service (model calls + response parsing): `src/modules/feedback-notes/infrastructure/services/gemini-feedback-ai.service.ts`
- Generate use case: `src/modules/feedback-notes/application/use-cases/generate-final-feedback.use-case.ts`

## Data Flow

The route receives a Gemini API key and model, composes the Feedback Notes module, and creates a `GenerateFinalFeedbackUseCase` with `GeminiFeedbackAIService`. The use case loads the feedback, verifies it is active, loads all entries, rejects empty entry sets, calls the AI service, saves the result into `final_feedback`, and records `feedback_final_feedback_generated`.

## Maintenance Notes

Keep prompt text and prompt builders in `src/modules/feedback-notes/infrastructure/services/feedback-notes-prompts.ts`. Keep Gemini SDK calls and response parsing in `src/modules/feedback-notes/infrastructure/services/gemini-feedback-ai.service.ts`. When changing the prompt, the input data, response shape, or generate controller behavior, update this document in the same change.

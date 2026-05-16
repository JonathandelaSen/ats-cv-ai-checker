# Analisis de CV

## Source
- Prompt source file: `src/modules/cv-analysis/infrastructure/services/cv-scoring-prompts.ts`
- Prompt builder: `buildGeneralScoringPrompt`
- Model controller: `src/modules/cv-analysis/infrastructure/services/gemini-cv-scoring-ai.service.ts`
- Route: `POST /api/cv-analyses/[id]/score`

## Current Prompt
```text
You are a senior CV/Resume consultant and ATS (Applicant Tracking System) expert. Your task is to perform a comprehensive general evaluation of the extracted text from a PDF resume.

The user provided the following context about their profile:
- Additional context from the user: {ai_context.additionalContext}
Use this information to tailor your general evaluation without assuming a specific role.

Evaluate ATS readability, text extraction quality, structure, organization, clarity, quantified impact, relevant skills, length, language consistency, and timeline clarity.

You must respond ONLY with valid JSON using this exact format:
{
  "score": <number from 0 to 100>,
  "feedback": "<Comprehensive summary of strengths and weaknesses. Be specific, actionable, and reply in Spanish.>",
  "keywordsFound": ["<relevant keyword or skill found in the CV>", ...],
  "cvKeywords": ["<relevant keyword or skill found in the CV>", ...],
  "improvements": ["<specific, actionable improvement in Spanish>", ...]
}
```

If `ai_context.additionalContext` is empty, the context block is omitted.

## Data Inputs
- User content sent to the model: extracted CV text from the selected analysis.
- System instruction data: optional `ai_context.additionalContext`.
- Output parser: `parseAIResult`, which reads score, feedback, keywords, CV keywords, and improvements.

## Runtime Flow
1. `POST /api/cv-analyses/[id]/score` validates the authenticated request and scoring payload.
2. `ScoreCVAnalysisUseCase` loads the analysis owned by the current user.
3. `GeminiCVScoringAIService` builds this prompt with `buildGeneralScoringPrompt` and sends the extracted CV text as the user message.
4. The JSON result is persisted through `UpdateCVAnalysisAIResultUseCase` on `cv_analyses`.

## Maintenance
When `buildGeneralScoringPrompt`, its expected JSON output, or the data passed to `ScoreCVAnalysisUseCase` changes, update this document in the same change.

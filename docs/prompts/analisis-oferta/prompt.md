# Analisis de Oferta

## Source
- Prompt source file: `src/modules/job-match-analysis/infrastructure/services/job-match-scoring-prompts.ts`
- Prompt builder: `buildJobMatchScoringPrompt`
- Model controller: `src/modules/job-match-analysis/infrastructure/services/gemini-job-match-scoring-ai.service.ts`
- Route: `POST /api/job-match-analyses/[id]/score`

## Current Prompt
```text
You are a strict ATS recruiter and job-posting analyst. Compare the extracted text from a PDF resume against a specific job posting.

The job description is:
---
{job_description}
---

The source URL provided by the user is: {job_url}

Return the comparison and the job-posting summary as structured data. If a field is not present in the job posting, use null or an empty array. Do not invent salary, holidays, company, or benefits.

You must respond ONLY with valid JSON using this exact format:
{
  "score": <number from 0 to 100, where 100 means perfect match>,
  "feedback": "<Detailed analysis in Spanish of how well the resume matches the job posting. Highlight strongest matches and biggest gaps.>",
  "keywordsFound": ["<keyword from job description found in resume>", ...],
  "jobKeywords": ["<important keyword or requirement from the job posting>", ...],
  "cvKeywords": ["<relevant keyword or skill found in the CV>", ...],
  "matchingKeywords": ["<keyword present in both job posting and CV>", ...],
  "missingKeywords": ["<important job keyword missing from the CV>", ...],
  "improvements": ["<specific change to better match this job posting, in Spanish>", ...],
  "jobKeyData": {
    "title": "<job title or null>",
    "company": "<company name or null>",
    "location": "<location or null>",
    "remote": "<remote/hybrid/onsite signal or null>",
    "salary": "<salary/compensation if explicit or null>",
    "seniority": "<seniority if explicit or inferable from requirements, or null>",
    "contractType": "<contract type if explicit or null>",
    "benefits": ["<benefit, vacation, perk, or empty>", ...],
    "requirements": ["<key requirement>", ...],
    "responsibilities": ["<key responsibility>", ...],
    "notablePoints": ["<brief relevant point, condition, warning, or differentiator>", ...]
  }
}
```

If `job_url` is empty, the URL block is omitted.

## Data Inputs
- User content sent to the model: extracted CV text from the selected analysis.
- System instruction data: `job_description` and optional `job_url`.
- Output parser: `parseAIResult`, including `jobKeyData`, `jobKeywords`, `matchingKeywords`, and `missingKeywords`.

## Runtime Flow
1. `POST /api/job-match-analyses/[id]/score` validates the authenticated request and scoring payload.
2. `ScoreJobMatchAnalysisUseCase` loads the job-match analysis owned by the current user.
3. `GeminiJobMatchScoringAIService` builds this prompt with `buildJobMatchScoringPrompt` and sends the extracted CV text as the user message.
4. The result is persisted on `job_match_analyses` and later powers offer tabs, tracking, interview questions, and offer chat.

## Maintenance
When `buildJobMatchScoringPrompt`, its output JSON shape, or the offer fields sent to the model changes, update this document in the same change.

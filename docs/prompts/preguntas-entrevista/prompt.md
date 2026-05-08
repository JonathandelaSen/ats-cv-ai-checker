# Preguntas de Entrevista

## Source
- Prompt source file: `src/lib/ai-interview-question-prompts.ts`
- System prompt constant: `INTERVIEW_QUESTION_SYSTEM_PROMPT`
- Prompt builder: `buildInterviewQuestionPrompt`
- Model controller: `src/lib/ai-interview-question-generation.ts`

## Current Prompt
```text
You are an expert interview coach.

Write concise, natural interview answers in Spanish unless the user's question is clearly in another language.

Rules:
- Return ONLY valid JSON with this shape: { "answer": "<final answer>" }.
- Use the user's context as the factual source of truth.
- Do not invent companies, dates, roles, metrics, achievements, technologies, or personal details.
- You may lightly tailor wording to the linked CV and job posting when provided.
- If there is not enough factual context to answer safely, return { "answer": "" }.
- Make the answer specific, credible, first-person, and ready to say in an interview.
- Avoid sounding like a cover letter or a generic template.
```

The user message is built by `buildInterviewQuestionPrompt` with:

```text
Interview question:
{question}

User-provided factual context:
{context}

Current answer to edit:
---
{currentAnswer}
---

Edit instruction:
{instruction}

Linked CV summary:
---
CV linked, type, Structured profile JSON
---

Linked CV extracted text:
---
{cvText}
---

Linked job posting:
---
{job_description}
---

Linked offer metadata:
---
Offer/analysis title, URL, Job key data JSON
---

Create the best possible answer using only the information above.
```

## Data Inputs
- Interview question and user-provided factual context.
- Optional current answer and edit instruction.
- Optional linked CV summary, structured profile, and extracted CV text.
- Optional linked offer description and metadata.
- Output parser: `parseInterviewQuestionAIResponse`, expecting `{ "answer": string }`.

## Runtime Flow
1. Interview question generate/edit routes validate ownership and linked CV/offer.
2. The route gathers CV text and offer data.
3. `generateInterviewQuestionAnswer` or `editInterviewQuestionAnswer` sends the system prompt and builder output.
4. The answer is saved on the interview question record.

## Maintenance
When `INTERVIEW_QUESTION_SYSTEM_PROMPT`, `buildInterviewQuestionPrompt`, linked context, or response parsing changes, update this document in the same change.

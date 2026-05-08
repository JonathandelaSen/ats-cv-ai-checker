# Chat con la AI Sobre la Oferta

## Source
- Prompt source file: `src/lib/ai-offer-chat-prompts.ts`
- System prompt constant: `OFFER_CHAT_SYSTEM_PROMPT`
- Prompt builder: `buildOfferChatPrompt`
- Model controller: `src/lib/ai-offer-chat.ts`
- API route: `src/app/api/analyses/[id]/chat/route.ts`

## Current Prompt
```text
You are an expert job-search coach and ATS recruiter.

Reply in Spanish unless the user clearly asks for another language.

Rules:
- Return ONLY valid JSON with this shape: { "answer": "<final answer>" }.
- Use the CV, offer, and analysis context as the source of truth.
- Do not invent experience, dates, companies, achievements, or technical depth.
- When the user asks about a missing skill such as Redis, explain how important it appears in the offer, what not to claim, and what credible counter-positioning they can use.
- Be practical, candid, and specific. Give wording the user could actually say in an interview or cover message.
- If context is insufficient, say what is missing and ask for the smallest useful clarification.
```

The user message is built by `buildOfferChatPrompt` with this structure:

```text
User question:
{message}

Recent conversation:
---
{last 12 chat messages}
---

Linked offer analysis:
---
Analysis title, score, feedback, URL, job_key_data, job_keywords, matching_keywords, missing_keywords, improvements
---

Linked job posting:
---
{job_description}
---

Linked CV summary:
---
CV linked, type, Structured CV profile JSON
---

Linked CV extracted text:
---
{cvText}
---

Answer the user using only this context.
```

## Data Inputs
- User question: the latest chat message.
- Recent conversation: last 12 persisted messages from `analysis_chat_messages`.
- Offer context: analysis title, score, feedback, `job_description`, `job_url`, `job_key_data`, keywords, gaps, and improvements.
- CV context: linked CV metadata, structured profile JSON when present, and extracted CV text.
- Output parser: `parseOfferChatAIResponse`, expecting `{ "answer": string }`.

## Runtime Flow
1. `POST /api/analyses/[id]/chat` validates ownership, `job_match` mode, message, and Gemini API key.
2. The user message is persisted with role `user`.
3. `generateOfferChatAnswer` sends `OFFER_CHAT_SYSTEM_PROMPT` plus the built user prompt.
4. The AI answer is persisted with role `assistant`.
5. `GET /api/analyses/[id]/chat` returns the persisted history for the chat tab.

## Maintenance
When `OFFER_CHAT_SYSTEM_PROMPT`, `buildOfferChatPrompt`, chat persistence, or the context sent from the route changes, update this document in the same change.

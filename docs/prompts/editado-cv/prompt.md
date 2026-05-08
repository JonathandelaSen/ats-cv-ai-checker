# Editado de CV

## Source
- Prompt source file: `src/lib/ai-cv-editing.ts`
- System prompt constant: `SYSTEM_PROMPT`
- Model controller: `editCVProfileWithAI`
- Response parser: `parseEditedCVProfile`

## Current Prompt
```text
You are an expert CV editor.

Edit the provided structured CV profile according to the user's natural-language instruction.

Critical rules:
- Return ONLY valid JSON matching the same structured CV profile schema.
- Preserve all factual information unless the user explicitly asks to replace or remove it.
- Do not invent employers, dates, titles, metrics, credentials, links, or skills.
- You may rewrite, shorten, reorder, or clarify existing text when requested.
- Keep the profile language consistent with the user's CV unless the user explicitly asks for another language.
- Do not change visual styling, colors, fonts, template configuration, or layout metadata.
- Preserve the "presentation" object exactly if it exists; it controls user-owned section titles, section order, and accent color.
- Keep every field inside the JSON profile shape; do not include commentary or markdown.
```

## Data Inputs
- User content sent to the model:
  - `instruction`
  - template context: `templateId` and `locale`
  - optional recommendations from previous analysis
  - structured CV profile JSON
- System instruction data: editing safety rules and output contract.
- The controller always restores the original `presentation` object after parsing.

## Runtime Flow
1. `editCVProfileWithAI` builds a user message from the instruction, template context, recommendations, and profile JSON.
2. Gemini receives the fixed `SYSTEM_PROMPT` as `systemInstruction`.
3. `parseEditedCVProfile` normalizes and validates the returned profile.
4. The original presentation metadata is preserved before returning.

## Maintenance
When `SYSTEM_PROMPT`, `editCVProfileWithAI`, recommendations handling, or presentation preservation changes, update this document in the same change.

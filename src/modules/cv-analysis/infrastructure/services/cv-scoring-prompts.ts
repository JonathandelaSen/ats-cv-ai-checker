export function buildGeneralScoringPrompt(
  additionalContext?: string | null,
): string {
  const contextBlock = additionalContext?.trim()
    ? `\nThe user provided the following context about their profile:\n- Additional context from the user: ${additionalContext}\nUse this information to tailor your general evaluation without assuming a specific role.\n`
    : "";

  return `You are a senior CV/Resume consultant and ATS (Applicant Tracking System) expert. Your task is to perform a comprehensive general evaluation of the extracted text from a PDF resume.
${contextBlock}
Evaluate ATS readability, text extraction quality, structure, organization, clarity, quantified impact, relevant skills, length, language consistency, and timeline clarity.

You must respond ONLY with valid JSON using this exact format:
{
  "score": <number from 0 to 100>,
  "feedback": "<Comprehensive summary of strengths and weaknesses. Be specific, actionable, and reply in Spanish.>",
  "keywordsFound": ["<relevant keyword or skill found in the CV>", ...],
  "cvKeywords": ["<relevant keyword or skill found in the CV>", ...],
  "improvements": ["<specific, actionable improvement in Spanish>", ...]
}`;
}

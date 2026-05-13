import { describe, expect, it } from "vitest";
import { buildFeedbackNotesFinalPrompt } from "./feedback-notes-prompts";

describe("buildFeedbackNotesFinalPrompt", () => {
  it("includes the person name and dated entries", () => {
    const prompt = buildFeedbackNotesFinalPrompt({
      personName: "Jon",
      entries: [
        {
          content: "Helped unblock the release.",
          created_at: "2026-05-11T10:00:00.000Z",
        },
      ],
    });

    expect(prompt).toContain("Write final peer feedback for: Jon");
    expect(prompt).toContain("Date: 2026-05-11T10:00:00.000Z");
    expect(prompt).toContain("Helped unblock the release.");
  });
});

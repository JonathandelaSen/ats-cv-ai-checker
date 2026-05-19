import { describe, expect, it, vi } from "vitest";
import { HandleActivityContextSuggestionUseCase } from "./handle-activity-context-suggestion.use-case";

describe("HandleActivityContextSuggestionUseCase", () => {
  it("hides a suggestion without creating a context", async () => {
    const repo = {
      hideSuggestion: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(),
    };
    const tracker = { record: vi.fn().mockResolvedValue(undefined) };

    const result = await new HandleActivityContextSuggestionUseCase({
      activityContextRepo: repo as never,
      tracker: tracker as never,
    }).execute({
      userId: "user-1",
      action: "hide",
      type: "employment",
      name: "Acme",
      roleOrLabel: "Lead",
    });

    expect(result).toEqual({ ok: true });
    expect(repo.hideSuggestion).toHaveBeenCalledOnce();
    expect(repo.save).not.toHaveBeenCalled();
  });
});

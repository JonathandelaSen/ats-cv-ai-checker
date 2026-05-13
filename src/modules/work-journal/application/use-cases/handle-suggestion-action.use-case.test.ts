import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { HandleSuggestionActionUseCase } from "./handle-suggestion-action.use-case";

const supabase = getSupabaseClient();

describe("HandleSuggestionActionUseCase", () => {
  it("promotes a suggestion into a CV-created context and records observability", async () => {
    const user = await createTestUser("wj-suggestion-promote");
    const contextRepo = new SupabaseWorkJournalContextRepository();
    contextRepo.bindRequest(supabase);
    const tracker = createMockTracker();
    const useCase = new HandleSuggestionActionUseCase({ contextRepo, tracker });

    const context = await useCase.execute({
      userId: user.id,
      action: "promote",
      type: "employment",
      name: "Acme",
      role_or_label: "Engineer",
      is_default: true,
    });

    if ("ok" in context) throw new Error("Expected promoted suggestion to return a context.");

    expect(context).toMatchObject({
      userId: user.id,
      type: "employment",
      name: "Acme",
      roleOrLabel: "Engineer",
      isDefault: true,
    });

    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        stage: "work_journal_suggestion_promote",
        status: "started",
      })
    );
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        stage: "work_journal_suggestion_promote",
        status: "success",
        metadata: { contextId: context.id },
      })
    );
  });

  it("hides a suggestion and records observability", async () => {
    const user = await createTestUser("wj-suggestion-hide");
    const contextRepo = new SupabaseWorkJournalContextRepository();
    contextRepo.bindRequest(supabase);
    const tracker = createMockTracker();
    const useCase = new HandleSuggestionActionUseCase({ contextRepo, tracker });

    await expect(
      useCase.execute({
        userId: user.id,
        action: "hide",
        type: "project",
        name: "Internal Tools",
        role_or_label: null,
      })
    ).resolves.toEqual({ ok: true });

    await expect(
      contextRepo
        .listHiddenSuggestionKeys(user.id)
        .then((keys) => new Set(Array.from(keys).map((key) => key.toPrimitives())))
    ).resolves.toEqual(new Set(["project:internal tools"]));
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        stage: "work_journal_suggestion_hide",
        status: "success",
        metadata: { type: "project", name: "Internal Tools" },
      })
    );
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import type { JournalAIService } from "../../domain/repositories/journal-ai-service.repository";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { DraftEntryUseCase } from "./draft-entry.use-case";

const supabase = getSupabaseClient();

describe("DraftEntryUseCase", () => {
  it("validates context before calling the AI service and passes draft data", async () => {
    const user = await createTestUser("wj-draft-entry");
    const contextRepo = new SupabaseWorkJournalContextRepository();
    contextRepo.bindRequest(supabase);
    const context = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("context"),
      role_or_label: "Lead Engineer",
    });
    const aiService: JournalAIService = {
      draftEntry: vi.fn(async () => "Drafted final text"),
    };
    const useCase = new DraftEntryUseCase({
      contextRepo,
      aiService,
      tracker: createMockTracker(),
    });

    const result = await useCase.execute(user.id, context.id, {
      dateStart: "2026-08-01",
      dateEnd: "2026-08-02",
      topic: "Launch",
      notes: "Coordinated release",
    });

    expect(result).toBe("Drafted final text");
    expect(aiService.draftEntry).toHaveBeenCalledWith({
      context: expect.objectContaining({
        id: context.id,
        name: context.name,
        roleOrLabel: null,
      }),
      dateStart: "2026-08-01",
      dateEnd: "2026-08-02",
      topic: "Launch",
      notes: "Coordinated release",
    });
  });

  it("throws ContextNotFoundError without calling the AI service", async () => {
    const user = await createTestUser("wj-draft-entry-missing");
    const contextRepo = new SupabaseWorkJournalContextRepository();
    contextRepo.bindRequest(supabase);
    const aiService: JournalAIService = {
      draftEntry: vi.fn(async () => "Should not be used"),
    };
    const useCase = new DraftEntryUseCase({
      contextRepo,
      aiService,
      tracker: createMockTracker(),
    });

    await expect(
      useCase.execute(user.id, crypto.randomUUID(), {
        dateStart: "2026-08-01",
        dateEnd: null,
        topic: null,
        notes: "Notes",
      })
    ).rejects.toBeInstanceOf(ContextNotFoundError);
    expect(aiService.draftEntry).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import {
  createMockTracker,
  createTestUser,
  testLabel,
} from "@/modules/test-helpers/setup";
import type { JournalAIService } from "../../domain/repositories/journal-ai-service.repository";
import { DraftEntryUseCase } from "./draft-entry.use-case";

describe("DraftEntryUseCase", () => {
  it("passes provided context and draft data to the AI service", async () => {
    const user = await createTestUser("wj-draft-entry");
    const aiService: JournalAIService = {
      draftEntry: vi.fn(async () => "Drafted final text"),
    };
    const useCase = new DraftEntryUseCase({
      aiFactory: { create: vi.fn(() => aiService) },
      tracker: createMockTracker(),
    });

    const result = await useCase.execute(user.id, "context-1", {
      provider: "mock",
      model: "mock-model",
      context: {
        type: "employment",
        name: testLabel("context"),
        roleOrLabel: "Lead Engineer",
      },
      dateStart: "2026-08-01",
      dateEnd: "2026-08-02",
      topic: "Launch",
      notes: "Coordinated release",
    });

    expect(result).toBe("Drafted final text");
    expect(aiService.draftEntry).toHaveBeenCalledWith({
      context: expect.objectContaining({
        type: "employment",
        roleOrLabel: "Lead Engineer",
      }),
      dateStart: "2026-08-01",
      dateEnd: "2026-08-02",
      topic: "Launch",
      notes: "Coordinated release",
    });
  });
});

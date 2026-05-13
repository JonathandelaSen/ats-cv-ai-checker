import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { ListContextsUseCase } from "./list-contexts.use-case";

const supabase = getSupabaseClient();

describe("ListContextsUseCase", () => {
  it("returns contexts for the requested user only", async () => {
    const user = await createTestUser("wj-list-contexts");
    const otherUser = await createTestUser("wj-list-contexts-other");
    const contextRepo = new SupabaseWorkJournalContextRepository();
    contextRepo.bindRequest(supabase);
    const useCase = new ListContextsUseCase({ contextRepo });
    const first = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("first"),
    });
    const second = await contextRepo.create({
      user_id: user.id,
      type: "project",
      name: testLabel("second"),
    });
    await contextRepo.create({
      user_id: otherUser.id,
      type: "employment",
      name: testLabel("other"),
    });

    const result = await useCase.execute(user.id);

    expect(result.map((context) => context.id)).toEqual(
      expect.arrayContaining([first.id, second.id])
    );
    expect(result).toHaveLength(2);
    expect(result.every((context) => context.userId === user.id)).toBe(true);
  });
});

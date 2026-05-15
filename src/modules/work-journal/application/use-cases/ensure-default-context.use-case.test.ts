import { describe, expect, it } from "vitest";
import {
  createMockTracker,
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseCVDataRepository } from "../../infrastructure/repositories/supabase-cv-data.repository";
import { SupabaseWorkJournalContextRepository } from "../../infrastructure/repositories/supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "../../infrastructure/repositories/supabase-work-journal-entry.repository";
import { EnsureDefaultContextUseCase } from "./ensure-default-context.use-case";

const supabase = getSupabaseClient();

function makeUseCase() {
  const contextRepo = new SupabaseWorkJournalContextRepository();
  contextRepo.bindRequest(supabase);
  const entryRepo = new SupabaseWorkJournalEntryRepository();
  entryRepo.bindRequest(supabase);
  const cvDataRepo = new SupabaseCVDataRepository();
  cvDataRepo.bindRequest(supabase);
  const tracker = createMockTracker();
  return {
    contextRepo,
    entryRepo,
    useCase: new EnsureDefaultContextUseCase({ contextRepo, cvDataRepo, tracker }),
  };
}

describe("EnsureDefaultContextUseCase", () => {
  it("creates General for a user without contexts", async () => {
    const user = await createTestUser("wj-ensure-empty");
    const { contextRepo, useCase } = makeUseCase();

    await expect(useCase.execute(user.id).then((context) => context?.toPrimitives())).resolves.toMatchObject({
      name: "General",
      type: "other",
      isDefault: true,
    });
  });

  it("returns the General default instead of changing it to the latest entry context", async () => {
    const user = await createTestUser("wj-ensure-latest");
    const { contextRepo, entryRepo, useCase } = makeUseCase();
    const olderContext = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("older"),
    });
    const newerContext = await contextRepo.create({
      user_id: user.id,
      type: "project",
      name: testLabel("newer"),
    });
    const olderEntry = await entryRepo.create({
      user_id: user.id,
      context_id: olderContext.id,
      date_start: "2026-01-01",
      date_end: null,
      topic: "Older",
      input_mode: "manual",
      raw_notes: "Older notes",
      final_text: "Older text",
    });
    const newerEntry = await entryRepo.create({
      user_id: user.id,
      context_id: newerContext.id,
      date_start: "2026-01-02",
      date_end: null,
      topic: "Newer",
      input_mode: "manual",
      raw_notes: "Newer notes",
      final_text: "Newer text",
    });
    await supabase
      .from("work_journal_entries")
      .update({ updated_at: "2026-01-01T00:00:00.000Z" })
      .eq("id", olderEntry.id);
    await supabase
      .from("work_journal_entries")
      .update({ updated_at: "2026-01-03T00:00:00.000Z" })
      .eq("id", newerEntry.id);

    const general = await useCase.execute(user.id);

    expect(general?.toPrimitives()).toMatchObject({ name: "General", isDefault: true });
    await expect(
      contextRepo.getById(newerContext.id, user.id).then((context) => context?.toPrimitives())
    ).resolves.toMatchObject({
      isDefault: false,
    });
  });

  it("returns the existing default context without changing it", async () => {
    const user = await createTestUser("wj-ensure-existing");
    const { contextRepo, useCase } = makeUseCase();
    const defaultContext = await contextRepo.create({
      user_id: user.id,
      type: "employment",
      name: testLabel("default"),
      is_default: true,
    });
    await contextRepo.create({
      user_id: user.id,
      type: "project",
      name: testLabel("other"),
    });

    const result = await useCase.execute(user.id);
    const contexts = await contextRepo.list(user.id);

    expect(result?.toPrimitives()).toMatchObject({ id: defaultContext.id, isDefault: true });
    expect(contexts.filter((context) => context.isDefault)).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "./supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "./supabase-work-journal-entry.repository";

const supabase = getSupabaseClient();
const contextRepo = new SupabaseWorkJournalContextRepository(supabase);
const entryRepo = new SupabaseWorkJournalEntryRepository(supabase);

async function createContext(userId: string, name = testLabel("ctx")) {
  return contextRepo.create({
    user_id: userId,
    type: "employment",
    name,
    role_or_label: "Engineer",
  });
}

async function createEntry(
  userId: string,
  contextId: string,
  overrides: Partial<Parameters<typeof entryRepo.create>[0]> = {}
) {
  return entryRepo.create({
    user_id: userId,
    context_id: contextId,
    date_start: "2026-02-01",
    date_end: null,
    topic: testLabel("topic"),
    input_mode: "manual",
    raw_notes: "Built a useful integration test",
    final_text: "Built a useful integration test.",
    ...overrides,
  });
}

describe("SupabaseWorkJournalEntryRepository", () => {
  it("list applies context, search, topic, and date filters", async () => {
    const user = await createTestUser("wj-entry-list");
    const context = await createContext(user.id, testLabel("main"));
    const otherContext = await createContext(user.id, testLabel("other"));
    const matching = await createEntry(user.id, context.id, {
      date_start: "2026-03-10",
      topic: "Release notes",
      raw_notes: "Shipped the alpha parser",
      final_text: "Shipped the alpha parser successfully.",
    });
    await createEntry(user.id, context.id, {
      date_start: "2026-03-20",
      topic: "Interview prep",
      raw_notes: "Prepared questions",
      final_text: "Prepared questions.",
    });
    await createEntry(user.id, otherContext.id, {
      date_start: "2026-03-10",
      topic: "Release notes",
      raw_notes: "Shipped the alpha parser",
      final_text: "Shipped elsewhere.",
    });

    const result = await entryRepo.list(user.id, {
      contextId: context.id,
      search: "alpha parser",
      topic: "Release",
      dateFrom: "2026-03-01",
      dateTo: "2026-03-15",
    });

    expect(result.map((entry) => entry.id)).toEqual([matching.id]);
  });

  it("getById returns a matching entry", async () => {
    const user = await createTestUser("wj-entry-get");
    const context = await createContext(user.id);
    const entry = await createEntry(user.id, context.id);

    const result = await entryRepo.getById(entry.id, user.id);

    expect(result?.toPrimitives()).toMatchObject({
      id: entry.id,
      contextId: context.id,
    });
  });

  it("create persists and normalizes an entry", async () => {
    const user = await createTestUser("wj-entry-create");
    const context = await createContext(user.id);

    const entry = await createEntry(user.id, context.id, {
      date_start: "2026-04-01",
      date_end: "2026-04-02",
      topic: "Delivery",
      input_mode: "ai_assisted",
      raw_notes: "Raw notes",
      final_text: "Final text",
    });

    expect(entry.toPrimitives()).toMatchObject({
      userId: user.id,
      contextId: context.id,
      dateStart: "2026-04-01",
      dateEnd: "2026-04-02",
      topic: "Delivery",
      inputMode: "ai_assisted",
      rawNotes: "Raw notes",
      finalText: "Final text",
    });
  });

  it("update changes mutable fields", async () => {
    const user = await createTestUser("wj-entry-update");
    const context = await createContext(user.id);
    const entry = await createEntry(user.id, context.id);

    const updated = await entryRepo.update(entry.id, user.id, {
      topic: "Updated topic",
      final_text: "Updated final text",
    });

    expect(updated?.toPrimitives()).toMatchObject({
      id: entry.id,
      topic: "Updated topic",
      finalText: "Updated final text",
    });
  });

  it("delete removes an entry and returns false for a missing entry", async () => {
    const user = await createTestUser("wj-entry-delete");
    const context = await createContext(user.id);
    const entry = await createEntry(user.id, context.id);

    await expect(entryRepo.delete(entry.id, user.id)).resolves.toBeUndefined();
    await expect(entryRepo.getById(entry.id, user.id)).resolves.toBeNull();
    await expect(entryRepo.delete(crypto.randomUUID(), user.id)).resolves.toBeUndefined();
  });
});

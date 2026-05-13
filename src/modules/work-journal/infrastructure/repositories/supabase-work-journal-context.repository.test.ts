import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { SupabaseWorkJournalContextRepository } from "./supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "./supabase-work-journal-entry.repository";

const supabase = getSupabaseClient();
const contextRepo = new SupabaseWorkJournalContextRepository();
contextRepo.bindRequest(supabase);
const entryRepo = new SupabaseWorkJournalEntryRepository();
entryRepo.bindRequest(supabase);

async function createContext(userId: string, name = testLabel("ctx")) {
  return contextRepo.create({
    user_id: userId,
    type: "employment",
    name,
    role_or_label: "Senior Engineer",
  });
}

describe("SupabaseWorkJournalContextRepository", () => {
  it("list returns contexts for the requested user only", async () => {
    const user = await createTestUser("wj-context-list");
    const otherUser = await createTestUser("wj-context-list-other");

    const first = await createContext(user.id, testLabel("first"));
    const second = await contextRepo.create({
      user_id: user.id,
      type: "project",
      name: testLabel("second"),
      role_or_label: "Migration",
      is_default: true,
    });
    await createContext(otherUser.id, testLabel("other"));

    const result = await contextRepo.list(user.id);

    expect(result.map((context) => context.id)).toEqual(
      expect.arrayContaining([first.id, second.id])
    );
    expect(result).toHaveLength(2);
    expect(result.every((context) => context.userId === user.id)).toBe(true);
  });

  it("getById returns a matching context and null for a missing context", async () => {
    const user = await createTestUser("wj-context-get");
    const context = await createContext(user.id);

    await expect(
      contextRepo.getById(context.id, user.id).then((result) => result?.toPrimitives())
    ).resolves.toMatchObject({
      id: context.id,
      userId: user.id,
    });
    await expect(contextRepo.getById(crypto.randomUUID(), user.id)).resolves.toBeNull();
  });

  it("create persists the expected fields", async () => {
    const user = await createTestUser("wj-context-create");
    const name = testLabel("created");

    const context = await contextRepo.create({
      user_id: user.id,
      type: "project",
      name,
      role_or_label: "Launch",
      is_default: true,
      created_from_cv: true,
    });

    expect(context.toPrimitives()).toMatchObject({
      userId: user.id,
      type: "project",
      name,
      roleOrLabel: "Launch",
      status: "active",
      isDefault: true,
      createdFromCv: true,
    });
  });

  it("update changes mutable fields", async () => {
    const user = await createTestUser("wj-context-update");
    const context = await createContext(user.id);
    const name = testLabel("renamed");

    const updated = await contextRepo.update(context.id, user.id, {
      name,
      status: "archived",
    });

    expect(updated?.toPrimitives()).toMatchObject({
      id: context.id,
      name,
      status: "archived",
    });
  });

  it("listHiddenSuggestionKeys returns hidden suggestions as normalized keys", async () => {
    const user = await createTestUser("wj-context-hidden-list");

    await contextRepo.hideSuggestion(user.id, {
      type: "employment",
      name: "  Big   Company ",
    });

    await expect(
      contextRepo
        .listHiddenSuggestionKeys(user.id)
        .then((keys) => new Set(Array.from(keys).map((key) => key.toPrimitives())))
    ).resolves.toEqual(new Set(["employment:big company"]));
  });

  it("hideSuggestion inserts a hidden suggestion row", async () => {
    const user = await createTestUser("wj-context-hide");

    await contextRepo.hideSuggestion(user.id, {
      type: "project",
      name: "Internal Tools",
    });

    const { data, error } = await supabase
      .from("work_journal_hidden_context_suggestions")
      .select("user_id,type,name_key")
      .eq("user_id", user.id)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      user_id: user.id,
      type: "project",
      name_key: "internal tools",
    });
  });

  it("findLatestEntryContextId returns the context for the most recently updated entry", async () => {
    const user = await createTestUser("wj-context-latest");
    const olderContext = await createContext(user.id, testLabel("older"));
    const newerContext = await createContext(user.id, testLabel("newer"));
    const olderEntry = await entryRepo.create({
      user_id: user.id,
      context_id: olderContext.id,
      date_start: "2026-01-01",
      date_end: null,
      topic: "Older",
      input_mode: "manual",
      raw_notes: "Older notes",
      final_text: "Older final text",
    });
    const newerEntry = await entryRepo.create({
      user_id: user.id,
      context_id: newerContext.id,
      date_start: "2026-01-02",
      date_end: null,
      topic: "Newer",
      input_mode: "manual",
      raw_notes: "Newer notes",
      final_text: "Newer final text",
    });

    await supabase
      .from("work_journal_entries")
      .update({ updated_at: "2026-01-01T00:00:00.000Z" })
      .eq("id", olderEntry.id);
    await supabase
      .from("work_journal_entries")
      .update({ updated_at: "2026-01-03T00:00:00.000Z" })
      .eq("id", newerEntry.id);

    await expect(
      contextRepo.findLatestEntryContextId(user.id).then((id) => id?.toPrimitives())
    ).resolves.toBe(newerContext.id);
  });
});

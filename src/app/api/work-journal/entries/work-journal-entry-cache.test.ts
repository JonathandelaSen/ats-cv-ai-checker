import { describe, expect, it } from "vitest";
import {
  addWorkJournalEntryToCache,
  removeWorkJournalEntryFromCache,
  replaceWorkJournalEntryInCache,
} from "@/features/work-journal/api/work-journal-entry-cache";
import type { WorkJournalEntryLegacy } from "@/features/work-journal/api/work-journal-types";

function entry(id: string, dateStart = "2026-05-18"): WorkJournalEntryLegacy {
  return {
    id,
    user_id: "user-1",
    context_id: "context-1",
    date_start: dateStart,
    date_end: null,
    topic: null,
    input_mode: "manual",
    raw_notes: `raw ${id}`,
    final_text: `final ${id}`,
    created_at: `${dateStart}T10:00:00.000Z`,
    updated_at: `${dateStart}T10:00:00.000Z`,
    metadata: {},
    context: null,
  };
}

describe("work journal entry cache updates", () => {
  it("adds a created entry without needing a full data refetch", () => {
    expect(addWorkJournalEntryToCache([entry("old")], entry("new"))).toEqual([
      entry("new"),
      entry("old"),
    ]);
  });

  it("replaces an edited entry in place", () => {
    const edited = { ...entry("entry-1"), final_text: "edited" };

    expect(
      replaceWorkJournalEntryInCache([entry("entry-1"), entry("entry-2")], edited)
    ).toEqual([edited, entry("entry-2")]);
  });

  it("removes a deleted entry", () => {
    expect(removeWorkJournalEntryFromCache([entry("one"), entry("two")], "one")).toEqual([
      entry("two"),
    ]);
  });
});

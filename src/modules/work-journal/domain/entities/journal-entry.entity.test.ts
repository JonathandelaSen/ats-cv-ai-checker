import { describe, expect, it } from "vitest";
import { IsoDate, OptionalIsoDate, Timestamp, UserId } from "@/modules/shared";
import { WorkJournalEntry } from "./journal-entry.entity";
import { WorkJournalContextId } from "../value-objects/work-journal-context-id.value-object";
import { WorkJournalEntryId } from "../value-objects/work-journal-entry-id.value-object";
import { WorkJournalFinalText } from "../value-objects/work-journal-final-text.value-object";
import { WorkJournalInputMode } from "../value-objects/work-journal-input-mode.value-object";
import { WorkJournalNotes } from "../value-objects/work-journal-notes.value-object";
import { WorkJournalTopic } from "../value-objects/work-journal-topic.value-object";

function createEntry() {
  return WorkJournalEntry.create({
    id: WorkJournalEntryId.fromPrimitives("entry-1"),
    userId: UserId.fromPrimitives("user-1"),
    contextId: WorkJournalContextId.fromPrimitives("ctx-1"),
    dateStart: IsoDate.fromPrimitives("2026-05-11"),
    dateEnd: OptionalIsoDate.fromPrimitives(null),
    topic: WorkJournalTopic.fromPrimitives("Launch"),
    inputMode: WorkJournalInputMode.fromPrimitives("manual"),
    rawNotes: WorkJournalNotes.fromPrimitives("Raw notes"),
    finalText: WorkJournalFinalText.fromPrimitives("Final text"),
    createdAt: Timestamp.fromPrimitives("2026-05-11T10:00:00.000Z"),
    updatedAt: Timestamp.fromPrimitives("2026-05-11T10:00:00.000Z"),
  });
}

describe("WorkJournalEntry", () => {
  it("creates an entry and records a created event", () => {
    const entry = createEntry();

    expect(entry.toPrimitives()).toMatchObject({
      id: "entry-1",
      userId: "user-1",
      contextId: "ctx-1",
      dateStart: "2026-05-11",
      topic: "Launch",
      inputMode: "manual",
    });
    expect(entry.pullDomainEvents().map((event) => event.eventName)).toEqual([
      "work_journal_entry_created",
    ]);
  });

  it("hydrates from primitives without recording events", () => {
    const entry = WorkJournalEntry.fromPrimitives(createEntry().toPrimitives());

    expect(entry.pullDomainEvents()).toEqual([]);
  });

  it("updates fields and records an updated event", () => {
    const entry = WorkJournalEntry.fromPrimitives(createEntry().toPrimitives());

    entry.update({
      topic: WorkJournalTopic.fromPrimitives("Updated"),
      finalText: WorkJournalFinalText.fromPrimitives("Updated final"),
    });

    expect(entry.toPrimitives()).toMatchObject({
      topic: "Updated",
      finalText: "Updated final",
    });
    expect(entry.pullDomainEvents()[0]?.toPrimitives()).toEqual({
      entryId: "entry-1",
      fields: ["topic", "finalText"],
    });
  });

  it("records a deleted event without mutating persistence state", () => {
    const entry = WorkJournalEntry.fromPrimitives(createEntry().toPrimitives());

    entry.delete();

    expect(entry.pullDomainEvents()[0]?.eventName).toBe("work_journal_entry_deleted");
  });
});

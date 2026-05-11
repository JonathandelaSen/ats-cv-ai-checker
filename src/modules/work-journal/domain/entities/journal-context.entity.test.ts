import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { WorkJournalContext } from "./journal-context.entity";
import { WorkJournalContextId } from "../value-objects/work-journal-context-id.value-object";
import { WorkJournalContextName } from "../value-objects/work-journal-context-name.value-object";
import { WorkJournalContextStatus } from "../value-objects/work-journal-context-status.value-object";
import { WorkJournalContextType } from "../value-objects/work-journal-context-type.value-object";
import { WorkJournalCreatedFromCv } from "../value-objects/work-journal-created-from-cv.value-object";
import { WorkJournalIsDefault } from "../value-objects/work-journal-is-default.value-object";
import { WorkJournalRoleOrLabel } from "../value-objects/work-journal-role-or-label.value-object";

function createContext() {
  return WorkJournalContext.create({
    id: WorkJournalContextId.fromPrimitives("ctx-1"),
    userId: UserId.fromPrimitives("user-1"),
    type: WorkJournalContextType.fromPrimitives("employment"),
    name: WorkJournalContextName.fromPrimitives("Acme"),
    roleOrLabel: WorkJournalRoleOrLabel.fromPrimitives("Engineer"),
    status: WorkJournalContextStatus.fromPrimitives("active"),
    isDefault: WorkJournalIsDefault.fromPrimitives(false),
    createdFromCv: WorkJournalCreatedFromCv.fromPrimitives(false),
    createdAt: Timestamp.fromPrimitives("2026-05-11T10:00:00.000Z"),
    updatedAt: Timestamp.fromPrimitives("2026-05-11T10:00:00.000Z"),
  });
}

describe("WorkJournalContext", () => {
  it("creates a context and records a created event", () => {
    const context = createContext();

    expect(context.toPrimitives()).toMatchObject({
      id: "ctx-1",
      userId: "user-1",
      type: "employment",
      name: "Acme",
      roleOrLabel: "Engineer",
      status: "active",
      isDefault: false,
    });
    expect(context.pullDomainEvents().map((event) => event.eventName)).toEqual([
      "work_journal_context_created",
    ]);
    expect(context.pullDomainEvents()).toEqual([]);
  });

  it("hydrates from primitives without recording events", () => {
    const context = WorkJournalContext.fromPrimitives(createContext().toPrimitives());

    expect(context.pullDomainEvents()).toEqual([]);
  });

  it("updates mutable fields and records an updated event", () => {
    const context = WorkJournalContext.fromPrimitives(createContext().toPrimitives());

    context.update({
      name: WorkJournalContextName.fromPrimitives("Renamed"),
      isDefault: WorkJournalIsDefault.fromPrimitives(true),
    });

    expect(context.toPrimitives()).toMatchObject({ name: "Renamed", isDefault: true });
    expect(context.pullDomainEvents()[0]?.toPrimitives()).toEqual({
      contextId: "ctx-1",
      fields: ["name", "isDefault"],
    });
  });
});

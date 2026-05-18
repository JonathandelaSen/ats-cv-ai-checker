import { describe, expect, it } from "vitest";
import type { ObjectivesWorkspace } from "@/features/objectives/api/objectives-api";
import {
  addObjectiveItemToWorkspace,
  addObjectiveToWorkspace,
  removeObjectiveFromWorkspace,
  removeObjectiveItemFromWorkspace,
  replaceObjectiveInWorkspace,
  replaceObjectiveItemInWorkspace,
} from "@/features/objectives/api/objectives-cache";

describe("objectives workspace cache helpers", () => {
  const workspace: ObjectivesWorkspace = {
    contexts: [
      {
        id: "ctx-1",
        userId: "user-1",
        type: "project",
        name: "Project",
        roleOrLabel: null,
        status: "active",
        isDefault: true,
        createdAt: "2026-05-18T10:00:00.000Z",
        updatedAt: "2026-05-18T10:00:00.000Z",
      },
    ],
    commitments: [
      {
        id: "objective-1",
        userId: "user-1",
        contextId: "ctx-1",
        title: "Original goal",
        description: null,
        successCriteria: null,
        resultNotes: null,
        source: "self",
        status: "active",
        priority: null,
        startDate: "2026-05-18",
        targetDate: null,
        createdAt: "2026-05-18T10:00:00.000Z",
        updatedAt: "2026-05-18T10:00:00.000Z",
        items: [
          {
            id: "item-1",
            userId: "user-1",
            commitmentId: "objective-1",
            title: "Original action",
            notes: null,
            evidenceNotes: null,
            status: "todo",
            dueDate: null,
            completedAt: null,
            orderIndex: 0,
            createdAt: "2026-05-18T10:00:00.000Z",
            updatedAt: "2026-05-18T10:00:00.000Z",
          },
        ],
        outcomes: [],
      },
    ],
  };

  it("adds, replaces, and removes objectives without dropping relations", () => {
    const optimistic = {
      ...workspace.commitments[0],
      id: "optimistic-objective",
      title: "Optimistic goal",
      items: [],
      outcomes: [],
    };
    const persisted = {
      ...optimistic,
      id: "objective-2",
      title: "Persisted goal",
    };

    const added = addObjectiveToWorkspace(workspace, optimistic);
    const replaced = replaceObjectiveInWorkspace(added, persisted, optimistic.id);
    const removed = removeObjectiveFromWorkspace(replaced, persisted.id);

    expect(added?.commitments.map((item) => item.id)).toEqual([
      optimistic.id,
      "objective-1",
    ]);
    expect(replaced?.commitments[0]).toEqual(persisted);
    expect(removed?.commitments.map((item) => item.id)).toEqual(["objective-1"]);
  });

  it("adds, replaces, and removes action items inside their parent objective", () => {
    const optimisticItem = {
      ...workspace.commitments[0].items[0],
      id: "optimistic-item",
      title: "Optimistic action",
      orderIndex: 1,
    };
    const persistedItem = {
      ...optimisticItem,
      id: "item-2",
      title: "Persisted action",
    };

    const added = addObjectiveItemToWorkspace(
      workspace,
      "objective-1",
      optimisticItem
    );
    const replaced = replaceObjectiveItemInWorkspace(
      added,
      persistedItem,
      optimisticItem.id
    );
    const removed = removeObjectiveItemFromWorkspace(replaced, persistedItem.id);

    expect(added?.commitments[0].items.map((item) => item.id)).toEqual([
      "item-1",
      optimisticItem.id,
    ]);
    expect(replaced?.commitments[0].items[1]).toEqual(persistedItem);
    expect(removed?.commitments[0].items.map((item) => item.id)).toEqual([
      "item-1",
    ]);
  });
});

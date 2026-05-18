import { describe, expect, it } from "vitest";
import {
  toCommitmentContextResponse,
  toCommitmentItemResponse,
  toCommitmentOutcomeResponse,
  toCommitmentResponse,
  toCommitmentsWorkspaceResponse,
  type CommitmentsWorkspaceResponse,
} from "./responses";

describe("commitments API response contracts", () => {
  const createdAt = "2026-05-18T10:00:00.000Z";
  const updatedAt = "2026-05-18T11:00:00.000Z";

  const context = {
    id: "ctx-1",
    userId: "user-1",
    type: "project" as const,
    name: "Migration",
    roleOrLabel: null,
    status: "active" as const,
    isDefault: true,
    createdAt,
    updatedAt,
  };

  const commitment = {
    id: "commitment-1",
    userId: "user-1",
    contextId: "ctx-1",
    title: "Ship route migration",
    description: "Move objectives out of shell state.",
    successCriteria: null,
    resultNotes: null,
    source: "self" as const,
    status: "active" as const,
    priority: "medium" as const,
    startDate: "2026-05-18",
    targetDate: null,
    createdAt,
    updatedAt,
  };

  const item = {
    id: "item-1",
    userId: "user-1",
    commitmentId: "commitment-1",
    title: "Add route",
    notes: null,
    evidenceNotes: "Build passes",
    status: "todo" as const,
    dueDate: null,
    completedAt: null,
    orderIndex: 0,
    createdAt,
    updatedAt,
  };

  const outcome = {
    id: "outcome-1",
    userId: "user-1",
    commitmentId: "commitment-1",
    type: "leadership" as const,
    status: "expected" as const,
    title: "Cleaner navigation",
    description: null,
    amount: null,
    currency: "EUR",
    decidedAt: null,
    createdAt,
    updatedAt,
  };

  it("maps individual presenter outputs to camelCase HTTP response data", () => {
    expect(toCommitmentContextResponse(context)).toEqual(context);
    expect(toCommitmentResponse(commitment)).toEqual(commitment);
    expect(toCommitmentItemResponse(item)).toEqual(item);
    expect(toCommitmentOutcomeResponse(outcome)).toEqual(outcome);
  });

  it("maps a workspace presenter output with related items and outcomes", () => {
    const response = toCommitmentsWorkspaceResponse({
      contexts: [context],
      commitments: [{ ...commitment, items: [item], outcomes: [outcome] }],
    });

    expect(response satisfies CommitmentsWorkspaceResponse).toEqual({
      contexts: [context],
      commitments: [{ ...commitment, items: [item], outcomes: [outcome] }],
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  toReceivedFeedbackResponse,
  type ListReceivedFeedbackResponse,
} from "./responses";
import {
  toActivityContextResponse,
  type ListActivityContextsResponse,
} from "../activity-contexts/responses";

describe("received feedback API response contracts", () => {
  it("maps received feedback presenter output to camelCase HTTP response data", () => {
    const response = toReceivedFeedbackResponse({
      id: "feedback-1",
      userId: "user-1",
      activityContextId: "context-1",
      receivedDate: "2026-05-18",
      giverName: "Marta",
      feedbackText: "Strong ownership.",
      userNote: null,
      createdAt: "2026-05-18T10:00:00.000Z",
      updatedAt: "2026-05-18T11:00:00.000Z",
    });

    expect(response satisfies ListReceivedFeedbackResponse[number]).toEqual({
      id: "feedback-1",
      userId: "user-1",
      activityContextId: "context-1",
      receivedDate: "2026-05-18",
      giverName: "Marta",
      feedbackText: "Strong ownership.",
      userNote: null,
      createdAt: "2026-05-18T10:00:00.000Z",
      updatedAt: "2026-05-18T11:00:00.000Z",
    });
  });

  it("maps activity context presenter output to camelCase HTTP response data", () => {
    const response = toActivityContextResponse({
      id: "context-1",
      userId: "user-1",
      name: "Platform migration",
      type: "project",
      status: "active",
      isDefault: true,
      createdAt: "2026-05-18T10:00:00.000Z",
      updatedAt: "2026-05-18T11:00:00.000Z",
    });

    expect(response satisfies ListActivityContextsResponse["contexts"][number]).toEqual({
      id: "context-1",
      userId: "user-1",
      name: "Platform migration",
      type: "project",
      status: "active",
      isDefault: true,
      createdAt: "2026-05-18T10:00:00.000Z",
      updatedAt: "2026-05-18T11:00:00.000Z",
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  parseCreateReceivedFeedbackRequest,
  parseUpdateReceivedFeedbackRequest,
} from "./validation";

describe("received feedback HTTP validation", () => {
  it("normalizes a create request into use case input", () => {
    const result = parseCreateReceivedFeedbackRequest({
      activityContextId: "ctx-1",
      receivedDate: " 2026-01-15 ",
      giverName: "  Ada ",
      feedbackText: "  Strong collaboration notes. ",
      userNote: "  Follow up later. ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        activityContextId: "ctx-1",
        receivedDate: "2026-01-15",
        giverName: "Ada",
        feedbackText: "Strong collaboration notes.",
        userNote: "Follow up later.",
      },
    });
  });

  it("defaults an omitted create user note to null", () => {
    const result = parseCreateReceivedFeedbackRequest({
      activityContextId: "ctx-1",
      receivedDate: "2026-01-15",
      giverName: "Ada",
      feedbackText: "Strong collaboration notes.",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        activityContextId: "ctx-1",
        receivedDate: "2026-01-15",
        giverName: "Ada",
        feedbackText: "Strong collaboration notes.",
        userNote: null,
      },
    });
  });

  it("rejects invalid create payloads consistently", () => {
    const result = parseCreateReceivedFeedbackRequest({
      activityContextId: "ctx-1",
      receivedDate: "2026-99-99",
      giverName: "Ada",
      feedbackText: "Strong collaboration notes.",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        message: "Received date must use YYYY-MM-DD format",
        status: 400,
      },
    });
  });

  it("requires activity context on create", () => {
    const result = parseCreateReceivedFeedbackRequest({
      receivedDate: "2026-01-15",
      giverName: "Ada",
      feedbackText: "Strong collaboration notes.",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        message: "Activity context is required",
        status: 400,
      },
    });
  });

  it("normalizes only provided update fields", () => {
    const result = parseUpdateReceivedFeedbackRequest({
      feedbackText: "  Updated feedback. ",
      userNote: null,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        feedbackText: "Updated feedback.",
        userNote: null,
      },
    });
  });

  it("rejects invalid optional update fields", () => {
    const result = parseUpdateReceivedFeedbackRequest({
      userNote: ["not text"],
    });

    expect(result).toEqual({
      ok: false,
      error: {
        message: "Private note must be text or null",
        status: 400,
      },
    });
  });
});

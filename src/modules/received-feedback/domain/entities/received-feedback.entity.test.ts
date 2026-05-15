import { describe, expect, it } from "vitest";
import { EntityId, UserId } from "@/modules/shared";
import { ReceivedFeedback } from "./received-feedback.entity";
import { ReceivedFeedbackId } from "../value-objects/received-feedback-id.value-object";
import { ReceivedFeedbackDate } from "../value-objects/received-feedback-date.value-object";
import { ReceivedFeedbackGiverName } from "../value-objects/received-feedback-giver-name.value-object";
import { ReceivedFeedbackText } from "../value-objects/received-feedback-text.value-object";
import { ReceivedFeedbackNote } from "../value-objects/received-feedback-note.value-object";

describe("ReceivedFeedback", () => {
  it("creates private received feedback and records a domain event", () => {
    const feedback = ReceivedFeedback.create({
      id: ReceivedFeedbackId.fromPrimitives("feedback-1"),
      userId: UserId.fromPrimitives("user-1"),
      activityContextId: EntityId.fromPrimitives("ctx-1"),
      receivedDate: ReceivedFeedbackDate.fromPrimitives("2026-05-01", "2026-05-12"),
      giverName: ReceivedFeedbackGiverName.fromPrimitives(" Manager "),
      feedbackText: ReceivedFeedbackText.fromPrimitives(" Keep driving alignment. "),
      userNote: ReceivedFeedbackNote.fromPrimitives(" Follow up next 1:1. "),
      createdAt: "2026-05-12T10:00:00.000Z",
      updatedAt: "2026-05-12T10:00:00.000Z",
    });

    expect(feedback.toPrimitives()).toMatchObject({
      id: "feedback-1",
      userId: "user-1",
      activityContextId: "ctx-1",
      receivedDate: "2026-05-01",
      giverName: "Manager",
      feedbackText: "Keep driving alignment.",
      userNote: "Follow up next 1:1.",
    });
    expect(feedback.pullDomainEvents()).toHaveLength(1);
  });

  it("updates editable fields and stores an empty note as null", () => {
    const feedback = ReceivedFeedback.fromPrimitives({
      id: "feedback-1",
      userId: "user-1",
      activityContextId: "ctx-1",
      receivedDate: "2026-05-01",
      giverName: "Manager",
      feedbackText: "Initial feedback.",
      userNote: "Initial note.",
      createdAt: "2026-05-12T10:00:00.000Z",
      updatedAt: "2026-05-12T10:00:00.000Z",
    });

    feedback.update({
      receivedDate: ReceivedFeedbackDate.fromPrimitives("2026-05-02", "2026-05-12"),
      giverName: ReceivedFeedbackGiverName.fromPrimitives("Lead"),
      feedbackText: ReceivedFeedbackText.fromPrimitives("Updated feedback."),
      userNote: ReceivedFeedbackNote.fromPrimitives(" "),
      updatedAt: "2026-05-12T11:00:00.000Z",
    });

    expect(feedback.toPrimitives()).toMatchObject({
      receivedDate: "2026-05-02",
      giverName: "Lead",
      feedbackText: "Updated feedback.",
      userNote: null,
      updatedAt: "2026-05-12T11:00:00.000Z",
    });
    expect(feedback.pullDomainEvents()).toHaveLength(1);
  });
});

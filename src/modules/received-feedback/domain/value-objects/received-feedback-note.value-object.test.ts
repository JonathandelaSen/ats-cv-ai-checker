import { describe, expect, it } from "vitest";
import { ReceivedFeedbackNote } from "./received-feedback-note.value-object";

describe("ReceivedFeedbackNote", () => {
  it("stores blank optional notes as null", () => {
    expect(ReceivedFeedbackNote.fromPrimitives(" ").toPrimitives()).toBeNull();
  });

  it("trims non-empty notes", () => {
    expect(ReceivedFeedbackNote.fromPrimitives(" Follow up ").toPrimitives()).toBe("Follow up");
  });
});

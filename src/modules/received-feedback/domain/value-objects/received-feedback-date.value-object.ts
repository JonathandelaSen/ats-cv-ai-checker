import { IsoDate } from "@/modules/shared";

export class ReceivedFeedbackDate extends IsoDate {
  private constructor(value: string, today: string) {
    super(value, "Received feedback date");
    if (value > today) throw new Error("Received feedback date cannot be in the future.");
  }

  static fromPrimitives(value: string, today = new Date().toISOString().slice(0, 10)): ReceivedFeedbackDate {
    return new ReceivedFeedbackDate(value, today);
  }
}

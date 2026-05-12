import type { ReceivedFeedback } from "../../domain/entities/received-feedback.entity";

export function presentReceivedFeedback(feedback: ReceivedFeedback) {
  return feedback.toPrimitives();
}

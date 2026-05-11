import { AggregateRoot } from "@/modules/shared";
import { FeedbackClosedEvent } from "../events/feedback-closed.event";
import { FeedbackCreatedEvent } from "../events/feedback-created.event";
import { FeedbackDeletedEvent } from "../events/feedback-deleted.event";
import { FeedbackReopenedEvent } from "../events/feedback-reopened.event";
import { FeedbackUpdatedEvent } from "../events/feedback-updated.event";

export type FeedbackStatus = "active" | "closed";

export interface FeedbackPrimitives {
  id: string;
  user_id: string;
  person_name: string;
  status: FeedbackStatus;
  final_feedback: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackParams {
  id: string;
  user_id: string;
  person_name: string;
  final_feedback?: string | null;
  now: string;
}

export class Feedback extends AggregateRoot {
  private constructor(private primitives: FeedbackPrimitives) {
    super();
  }

  static create(params: CreateFeedbackParams): Feedback {
    const feedback = new Feedback({
      id: params.id,
      user_id: params.user_id,
      person_name: params.person_name.trim(),
      status: "active",
      final_feedback: normalizeOptionalText(params.final_feedback),
      closed_at: null,
      created_at: params.now,
      updated_at: params.now,
    });
    feedback.recordDomainEvent(new FeedbackCreatedEvent(params.id));
    return feedback;
  }

  static fromPrimitives(primitives: FeedbackPrimitives): Feedback {
    return new Feedback({ ...primitives });
  }

  get id(): string {
    return this.primitives.id;
  }

  get userId(): string {
    return this.primitives.user_id;
  }

  get status(): FeedbackStatus {
    return this.primitives.status;
  }

  isActive(): boolean {
    return this.primitives.status === "active";
  }

  updatePersonName(personName: string): void {
    this.primitives.person_name = personName.trim();
    this.recordDomainEvent(new FeedbackUpdatedEvent(this.id, ["person_name"]));
  }

  updateFinalFeedback(finalFeedback: string | null): void {
    this.primitives.final_feedback = normalizeOptionalText(finalFeedback);
    this.recordDomainEvent(
      new FeedbackUpdatedEvent(this.id, ["final_feedback"])
    );
  }

  close(now: string): void {
    this.primitives.status = "closed";
    this.primitives.closed_at = now;
    this.recordDomainEvent(new FeedbackClosedEvent(this.id));
  }

  reopen(): void {
    this.primitives.status = "active";
    this.primitives.closed_at = null;
    this.recordDomainEvent(new FeedbackReopenedEvent(this.id));
  }

  delete(): void {
    this.recordDomainEvent(new FeedbackDeletedEvent(this.id));
  }

  toPrimitives(): FeedbackPrimitives {
    return { ...this.primitives };
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

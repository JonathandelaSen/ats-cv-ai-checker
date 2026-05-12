import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { Commitment, type CommitmentPriority, type CommitmentSource } from "../../domain/entities/commitment.entity";
import type { CommitmentRepository } from "../../domain/repositories/commitment.repository";
import { recordCommitmentEvent } from "./tracking";

export interface CreateCommitmentInput {
  userId: string;
  contextId: string;
  title: string;
  description?: string | null;
  successCriteria?: string | null;
  resultNotes?: string | null;
  source: CommitmentSource;
  priority?: CommitmentPriority | null;
  startDate?: string;
  targetDate?: string | null;
}

export class CreateCommitmentUseCase {
  constructor(private readonly deps: { commitmentRepo: CommitmentRepository; tracker: EventTracker }) {}

  async execute(input: CreateCommitmentInput): Promise<Commitment> {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const commitment = await this.deps.commitmentRepo.save(
      Commitment.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        contextId: EntityId.fromPrimitives(input.contextId),
        title: input.title,
        description: input.description,
        successCriteria: input.successCriteria,
        resultNotes: input.resultNotes,
        source: input.source,
        priority: input.priority,
        startDate: input.startDate ?? today,
        targetDate: input.targetDate,
        createdAt: now,
        updatedAt: now,
      })
    );
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_created",
      metadata: { commitmentId: commitment.id, source: input.source, priority: input.priority ?? null },
    });
    return commitment;
  }
}

import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentContext, type CommitmentContextType } from "../../domain/entities/commitment-context.entity";
import type { CommitmentContextRepository } from "../../domain/repositories/commitment-context.repository";
import { recordCommitmentEvent } from "./tracking";

export interface CreateCommitmentContextInput {
  userId: string;
  type: CommitmentContextType;
  name: string;
  roleOrLabel?: string | null;
}

export class CreateCommitmentContextUseCase {
  constructor(private readonly deps: { contextRepo: CommitmentContextRepository; tracker: EventTracker }) {}

  async execute(input: CreateCommitmentContextInput): Promise<CommitmentContext> {
    const now = new Date().toISOString();
    const context = await this.deps.contextRepo.save(
      CommitmentContext.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        type: input.type,
        name: input.name,
        roleOrLabel: input.roleOrLabel,
        createdAt: now,
        updatedAt: now,
      })
    );
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_context_created",
      metadata: { contextId: context.id, type: input.type },
    });
    return context;
  }
}

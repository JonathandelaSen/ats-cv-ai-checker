import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentContextNotFoundError } from "../../domain/errors/commitment-context-not-found.error";
import type { CommitmentContextStatus, CommitmentContextType } from "../../domain/entities/commitment-context.entity";
import type { CommitmentContextRepository } from "../../domain/repositories/commitment-context.repository";
import { recordCommitmentEvent } from "./tracking";

export interface UpdateCommitmentContextInput {
  userId: string;
  id: string;
  type?: CommitmentContextType;
  name?: string;
  roleOrLabel?: string | null;
  status?: CommitmentContextStatus;
}

export class UpdateCommitmentContextUseCase {
  constructor(private readonly deps: { contextRepo: CommitmentContextRepository; tracker: EventTracker }) {}

  async execute(input: UpdateCommitmentContextInput) {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const context = await this.deps.contextRepo.findById(id, userId);
    if (!context) throw new CommitmentContextNotFoundError();
    context.update({ ...input, updatedAt: new Date().toISOString() });
    const saved = await this.deps.contextRepo.save(context);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: input.status === "archived" ? "commitment_context_archived" : "commitment_context_updated",
      metadata: { contextId: input.id },
    });
    return saved;
  }
}

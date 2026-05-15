import { EntityId, UserId } from "@/modules/shared";
import { CommitmentContext } from "../../domain/entities/commitment-context.entity";
import type { CommitmentContextRepository } from "../../domain/repositories/commitment-context.repository";

export class EnsureDefaultCommitmentContextUseCase {
  constructor(private readonly deps: { contextRepo: CommitmentContextRepository }) {}

  async execute(userId: string): Promise<CommitmentContext> {
    const userIdValue = UserId.fromPrimitives(userId);
    const existing = await this.deps.contextRepo.findDefault(userIdValue);
    if (existing) return existing;
    const now = new Date().toISOString();
    return this.deps.contextRepo.save(
      CommitmentContext.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId: userIdValue,
        type: "other",
        name: "General",
        status: "active",
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      })
    );
  }
}

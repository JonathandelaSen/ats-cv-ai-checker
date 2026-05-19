import { UserId } from "@/modules/shared";
import type { CommitmentItem } from "../../domain/entities/commitment-item.entity";
import type { CommitmentOutcome } from "../../domain/entities/commitment-outcome.entity";
import type { Commitment } from "../../domain/entities/commitment.entity";
import type { CommitmentItemRepository } from "../../domain/repositories/commitment-item.repository";
import type { CommitmentOutcomeRepository } from "../../domain/repositories/commitment-outcome.repository";
import type { CommitmentRepository } from "../../domain/repositories/commitment.repository";

export interface CommitmentsWorkspace {
  commitments: Commitment[];
  items: CommitmentItem[];
  outcomes: CommitmentOutcome[];
}

export class ListCommitmentsWorkspaceUseCase {
  constructor(
    private readonly deps: {
      commitmentRepo: CommitmentRepository;
      itemRepo: CommitmentItemRepository;
      outcomeRepo: CommitmentOutcomeRepository;
    }
  ) {}

  async execute(userId: string): Promise<CommitmentsWorkspace> {
    const userIdValue = UserId.fromPrimitives(userId);
    const [commitments, items, outcomes] = await Promise.all([
      this.deps.commitmentRepo.search(userIdValue),
      this.deps.itemRepo.searchByUser(userIdValue),
      this.deps.outcomeRepo.searchByUser(userIdValue),
    ]);
    return { commitments, items, outcomes };
  }
}

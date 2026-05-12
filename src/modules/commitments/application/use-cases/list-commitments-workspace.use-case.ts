import { UserId } from "@/modules/shared";
import type { CommitmentContext } from "../../domain/entities/commitment-context.entity";
import type { CommitmentItem } from "../../domain/entities/commitment-item.entity";
import type { CommitmentOutcome } from "../../domain/entities/commitment-outcome.entity";
import type { Commitment } from "../../domain/entities/commitment.entity";
import type { CommitmentContextRepository } from "../../domain/repositories/commitment-context.repository";
import type { CommitmentItemRepository } from "../../domain/repositories/commitment-item.repository";
import type { CommitmentOutcomeRepository } from "../../domain/repositories/commitment-outcome.repository";
import type { CommitmentRepository } from "../../domain/repositories/commitment.repository";
import { EnsureDefaultCommitmentContextUseCase } from "./ensure-default-context.use-case";

export interface CommitmentsWorkspace {
  contexts: CommitmentContext[];
  commitments: Commitment[];
  items: CommitmentItem[];
  outcomes: CommitmentOutcome[];
}

export class ListCommitmentsWorkspaceUseCase {
  private readonly ensureDefault: EnsureDefaultCommitmentContextUseCase;

  constructor(
    private readonly deps: {
      contextRepo: CommitmentContextRepository;
      commitmentRepo: CommitmentRepository;
      itemRepo: CommitmentItemRepository;
      outcomeRepo: CommitmentOutcomeRepository;
    }
  ) {
    this.ensureDefault = new EnsureDefaultCommitmentContextUseCase({ contextRepo: deps.contextRepo });
  }

  async execute(userId: string): Promise<CommitmentsWorkspace> {
    await this.ensureDefault.execute(userId);
    const userIdValue = UserId.fromPrimitives(userId);
    const [contexts, commitments, items, outcomes] = await Promise.all([
      this.deps.contextRepo.search(userIdValue),
      this.deps.commitmentRepo.search(userIdValue),
      this.deps.itemRepo.searchByUser(userIdValue),
      this.deps.outcomeRepo.searchByUser(userIdValue),
    ]);
    return { contexts, commitments, items, outcomes };
  }
}

import type { CommitmentItem } from "../../domain/entities/commitment-item.entity";
import type { CommitmentOutcome } from "../../domain/entities/commitment-outcome.entity";
import type { Commitment } from "../../domain/entities/commitment.entity";
import type { CommitmentsWorkspace } from "../use-cases/list-commitments-workspace.use-case";

export interface CommitmentWorkspaceItem {
  commitment: ReturnType<Commitment["toPrimitives"]>;
  items: ReturnType<CommitmentItem["toPrimitives"]>[];
  outcomes: ReturnType<CommitmentOutcome["toPrimitives"]>[];
}

export function presentCommitment(commitment: Commitment) {
  return commitment.toPrimitives();
}

export function presentCommitmentItem(item: CommitmentItem) {
  return item.toPrimitives();
}

export function presentCommitmentOutcome(outcome: CommitmentOutcome) {
  return outcome.toPrimitives();
}

export function presentCommitmentsWorkspace(workspace: CommitmentsWorkspace) {
  return {
    contexts: [],
    commitments: workspace.commitments.map((commitment) => {
      const primitives = commitment.toPrimitives();
      return {
        ...primitives,
        items: workspace.items
          .map((item) => item.toPrimitives())
          .filter((item) => item.commitmentId === primitives.id),
        outcomes: workspace.outcomes
          .map((outcome) => outcome.toPrimitives())
          .filter((outcome) => outcome.commitmentId === primitives.id),
      };
    }),
  };
}

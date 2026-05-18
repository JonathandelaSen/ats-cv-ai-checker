import type {
  ObjectiveContext,
  ObjectiveItem,
  ObjectiveOutcome,
  ObjectiveWithRelations,
  ObjectivesWorkspace,
} from "./objectives-api";

export function addObjectiveContextToWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  context: ObjectiveContext
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    contexts: [
      context,
      ...workspace.contexts.filter((item) => item.id !== context.id),
    ],
  };
}

export function replaceObjectiveContextInWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  context: ObjectiveContext,
  matchId = context.id
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    contexts: workspace.contexts.map((item) =>
      item.id === matchId ? context : item
    ),
  };
}

export function addObjectiveToWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  objective: ObjectiveWithRelations
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: [
      objective,
      ...workspace.commitments.filter((item) => item.id !== objective.id),
    ],
  };
}

export function replaceObjectiveInWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  objective: ObjectiveWithRelations,
  matchId = objective.id
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.map((item) =>
      item.id === matchId ? objective : item
    ),
  };
}

export function removeObjectiveFromWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  id: string
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.filter((item) => item.id !== id),
  };
}

export function addObjectiveItemToWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  objectiveId: string,
  item: ObjectiveItem
) {
  return updateObjectiveRelation(workspace, objectiveId, (objective) => ({
    ...objective,
    items: [...objective.items.filter((current) => current.id !== item.id), item],
  }));
}

export function replaceObjectiveItemInWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  item: ObjectiveItem,
  matchId = item.id
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.map((objective) => ({
      ...objective,
      items: objective.items.map((current) =>
        current.id === matchId ? item : current
      ),
    })),
  };
}

export function removeObjectiveItemFromWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  id: string
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.map((objective) => ({
      ...objective,
      items: objective.items.filter((item) => item.id !== id),
    })),
  };
}

export function addObjectiveOutcomeToWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  objectiveId: string,
  outcome: ObjectiveOutcome
) {
  return updateObjectiveRelation(workspace, objectiveId, (objective) => ({
    ...objective,
    outcomes: [
      ...objective.outcomes.filter((current) => current.id !== outcome.id),
      outcome,
    ],
  }));
}

export function replaceObjectiveOutcomeInWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  outcome: ObjectiveOutcome,
  matchId = outcome.id
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.map((objective) => ({
      ...objective,
      outcomes: objective.outcomes.map((current) =>
        current.id === matchId ? outcome : current
      ),
    })),
  };
}

export function removeObjectiveOutcomeFromWorkspace(
  workspace: ObjectivesWorkspace | undefined,
  id: string
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.map((objective) => ({
      ...objective,
      outcomes: objective.outcomes.filter((outcome) => outcome.id !== id),
    })),
  };
}

function updateObjectiveRelation(
  workspace: ObjectivesWorkspace | undefined,
  objectiveId: string,
  update: (objective: ObjectiveWithRelations) => ObjectiveWithRelations
) {
  if (!workspace) return workspace;
  return {
    ...workspace,
    commitments: workspace.commitments.map((objective) =>
      objective.id === objectiveId ? update(objective) : objective
    ),
  };
}

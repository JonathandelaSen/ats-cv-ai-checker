"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type CreateObjectiveContextInput,
  type Objective,
  type ObjectiveContext,
  type ObjectiveItem,
  type ObjectiveOutcome,
  type ObjectiveWithRelations,
  type ObjectivesWorkspace,
  type SaveObjectiveInput,
  type SaveObjectiveItemInput,
  type SaveObjectiveOutcomeInput,
  createObjective,
  createObjectiveContext,
  createObjectiveItem,
  createObjectiveOutcome,
  deleteObjective,
  deleteObjectiveItem,
  deleteObjectiveOutcome,
  updateObjective,
  updateObjectiveItem,
  updateObjectiveOutcome,
} from "../api/objectives-api";
import {
  addObjectiveContextToWorkspace,
  addObjectiveItemToWorkspace,
  addObjectiveOutcomeToWorkspace,
  addObjectiveToWorkspace,
  removeObjectiveFromWorkspace,
  removeObjectiveItemFromWorkspace,
  removeObjectiveOutcomeFromWorkspace,
  replaceObjectiveContextInWorkspace,
  replaceObjectiveInWorkspace,
  replaceObjectiveItemInWorkspace,
  replaceObjectiveOutcomeInWorkspace,
} from "../api/objectives-cache";
import { objectivesQueryKeys } from "../api/objectives-query-keys";

interface OptimisticContext {
  previous?: ObjectivesWorkspace;
  optimisticId?: string;
}

interface CreateObjectiveMutationVariables {
  input: SaveObjectiveInput;
  optimisticId?: string;
}

export function useObjectivesMutations() {
  const queryClient = useQueryClient();
  const workspaceKey = objectivesQueryKeys.workspace();

  const getWorkspace = () =>
    queryClient.getQueryData<ObjectivesWorkspace>(workspaceKey);

  const setWorkspace = (
    update: (workspace: ObjectivesWorkspace | undefined) => ObjectivesWorkspace | undefined
  ) => {
    queryClient.setQueryData<ObjectivesWorkspace>(workspaceKey, update);
  };

  const startOptimisticUpdate = async () => {
    await queryClient.cancelQueries({ queryKey: workspaceKey });
    return getWorkspace();
  };

  const rollback = (context: OptimisticContext | undefined) => {
    if (context?.previous) {
      queryClient.setQueryData(workspaceKey, context.previous);
    }
  };

  const now = () => new Date().toISOString();

  const userIdFromWorkspace = (workspace: ObjectivesWorkspace | undefined) =>
    workspace?.contexts[0]?.userId ?? workspace?.commitments[0]?.userId ?? "optimistic";

  const optimisticContext = (
    input: CreateObjectiveContextInput,
    workspace: ObjectivesWorkspace | undefined,
    id: string
  ): ObjectiveContext => ({
    id,
    userId: userIdFromWorkspace(workspace),
    type: input.type,
    name: input.name,
    roleOrLabel: null,
    status: "active",
    isDefault: false,
    createdAt: now(),
    updatedAt: now(),
  });

  const optimisticObjective = (
    input: SaveObjectiveInput,
    workspace: ObjectivesWorkspace | undefined,
    id: string
  ): ObjectiveWithRelations => ({
    id,
    userId: userIdFromWorkspace(workspace),
    contextId: input.contextId,
    title: input.title,
    description: input.description,
    successCriteria: input.successCriteria,
    resultNotes: input.resultNotes,
    source: input.source,
    status: input.status ?? "active",
    priority: input.priority,
    startDate: input.startDate,
    targetDate: input.targetDate,
    createdAt: now(),
    updatedAt: now(),
    items: [],
    outcomes: [],
  });

  const optimisticItem = (
    objectiveId: string,
    input: Required<Pick<SaveObjectiveItemInput, "title">> &
      Omit<SaveObjectiveItemInput, "title">,
    workspace: ObjectivesWorkspace | undefined,
    id: string
  ): ObjectiveItem => ({
    id,
    userId: userIdFromWorkspace(workspace),
    commitmentId: objectiveId,
    title: input.title,
    notes: input.notes ?? null,
    evidenceNotes: input.evidenceNotes ?? null,
    status: input.status ?? "todo",
    dueDate: input.dueDate ?? null,
    completedAt: input.completedAt ?? null,
    orderIndex: input.orderIndex ?? 0,
    createdAt: now(),
    updatedAt: now(),
  });

  const optimisticOutcome = (
    objectiveId: string,
    input: Required<Pick<SaveObjectiveOutcomeInput, "title" | "type">> &
      Omit<SaveObjectiveOutcomeInput, "title" | "type">,
    workspace: ObjectivesWorkspace | undefined,
    id: string
  ): ObjectiveOutcome => ({
    id,
    userId: userIdFromWorkspace(workspace),
    commitmentId: objectiveId,
    type: input.type,
    status: input.status ?? "expected",
    title: input.title,
    description: input.description ?? null,
    amount: input.amount ?? null,
    currency: input.currency ?? "EUR",
    decidedAt: input.decidedAt ?? null,
    createdAt: now(),
    updatedAt: now(),
  });

  const mergeObjective = (
    serverObjective: Objective,
    previous: ObjectivesWorkspace | undefined,
    matchId = serverObjective.id
  ): ObjectiveWithRelations => {
    const existing = previous?.commitments.find((item) => item.id === matchId);
    return {
      ...serverObjective,
      items: existing?.items ?? [],
      outcomes: existing?.outcomes ?? [],
    };
  };

  const optimisticId = (kind: string) => `optimistic-${kind}-${Date.now()}`;

  return {
    createContext: useMutation({
      mutationFn: createObjectiveContext,
      onMutate: async (input) => {
        const previous = await startOptimisticUpdate();
        const id = optimisticId("context");
        setWorkspace((workspace) =>
          addObjectiveContextToWorkspace(
            workspace,
            optimisticContext(input, workspace, id)
          )
        );
        return { previous, optimisticId: id };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (context, _variables, mutationContext) => {
        setWorkspace((workspace) =>
          replaceObjectiveContextInWorkspace(
            workspace,
            context,
            mutationContext.optimisticId
          )
        );
      },
    }),
    createObjective: useMutation({
      mutationFn: ({ input }: CreateObjectiveMutationVariables) =>
        createObjective(input),
      onMutate: async ({ input, optimisticId: requestedOptimisticId }) => {
        const previous = await startOptimisticUpdate();
        const id = requestedOptimisticId ?? optimisticId("objective");
        setWorkspace((workspace) =>
          addObjectiveToWorkspace(
            workspace,
            optimisticObjective(input, workspace, id)
          )
        );
        return { previous, optimisticId: id };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (objective, _variables, context) => {
        setWorkspace((workspace) =>
          replaceObjectiveInWorkspace(
            workspace,
            mergeObjective(objective, workspace, context.optimisticId),
            context.optimisticId
          )
        );
      },
    }),
    updateObjective: useMutation({
      mutationFn: updateObjective,
      onMutate: async ({ id, updates }) => {
        const previous = await startOptimisticUpdate();
        const existing = previous?.commitments.find((item) => item.id === id);
        if (existing) {
          setWorkspace((workspace) =>
            replaceObjectiveInWorkspace(workspace, {
              ...existing,
              ...updates,
              updatedAt: now(),
            })
          );
        }
        return { previous };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (objective) => {
        setWorkspace((workspace) =>
          replaceObjectiveInWorkspace(
            workspace,
            mergeObjective(objective, workspace)
          )
        );
      },
    }),
    deleteObjective: useMutation({
      mutationFn: deleteObjective,
      onMutate: async (id) => {
        const previous = await startOptimisticUpdate();
        setWorkspace((workspace) => removeObjectiveFromWorkspace(workspace, id));
        return { previous };
      },
      onError: (_error, _variables, context) => rollback(context),
    }),
    createItem: useMutation({
      mutationFn: createObjectiveItem,
      onMutate: async ({ objectiveId, input }) => {
        const previous = await startOptimisticUpdate();
        const id = optimisticId("item");
        setWorkspace((workspace) =>
          addObjectiveItemToWorkspace(
            workspace,
            objectiveId,
            optimisticItem(objectiveId, input, workspace, id)
          )
        );
        return { previous, optimisticId: id };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (item, _variables, context) => {
        setWorkspace((workspace) =>
          replaceObjectiveItemInWorkspace(workspace, item, context.optimisticId)
        );
      },
    }),
    updateItem: useMutation({
      mutationFn: updateObjectiveItem,
      onMutate: async ({ id, updates }) => {
        const previous = await startOptimisticUpdate();
        const existing = previous?.commitments
          .flatMap((objective) => objective.items)
          .find((item) => item.id === id);
        if (existing) {
          setWorkspace((workspace) =>
            replaceObjectiveItemInWorkspace(workspace, {
              ...existing,
              ...updates,
              updatedAt: now(),
            })
          );
        }
        return { previous };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (item) => {
        setWorkspace((workspace) =>
          replaceObjectiveItemInWorkspace(workspace, item)
        );
      },
    }),
    deleteItem: useMutation({
      mutationFn: deleteObjectiveItem,
      onMutate: async (id) => {
        const previous = await startOptimisticUpdate();
        setWorkspace((workspace) => removeObjectiveItemFromWorkspace(workspace, id));
        return { previous };
      },
      onError: (_error, _variables, context) => rollback(context),
    }),
    createOutcome: useMutation({
      mutationFn: createObjectiveOutcome,
      onMutate: async ({ objectiveId, input }) => {
        const previous = await startOptimisticUpdate();
        const id = optimisticId("outcome");
        setWorkspace((workspace) =>
          addObjectiveOutcomeToWorkspace(
            workspace,
            objectiveId,
            optimisticOutcome(objectiveId, input, workspace, id)
          )
        );
        return { previous, optimisticId: id };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (outcome, _variables, context) => {
        setWorkspace((workspace) =>
          replaceObjectiveOutcomeInWorkspace(
            workspace,
            outcome,
            context.optimisticId
          )
        );
      },
    }),
    updateOutcome: useMutation({
      mutationFn: updateObjectiveOutcome,
      onMutate: async ({ id, updates }) => {
        const previous = await startOptimisticUpdate();
        const existing = previous?.commitments
          .flatMap((objective) => objective.outcomes)
          .find((outcome) => outcome.id === id);
        if (existing) {
          setWorkspace((workspace) =>
            replaceObjectiveOutcomeInWorkspace(workspace, {
              ...existing,
              ...updates,
              updatedAt: now(),
            })
          );
        }
        return { previous };
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (outcome) => {
        setWorkspace((workspace) =>
          replaceObjectiveOutcomeInWorkspace(workspace, outcome)
        );
      },
    }),
    deleteOutcome: useMutation({
      mutationFn: deleteObjectiveOutcome,
      onMutate: async (id) => {
        const previous = await startOptimisticUpdate();
        setWorkspace((workspace) => removeObjectiveOutcomeFromWorkspace(workspace, id));
        return { previous };
      },
      onError: (_error, _variables, context) => rollback(context),
    }),
  };
}

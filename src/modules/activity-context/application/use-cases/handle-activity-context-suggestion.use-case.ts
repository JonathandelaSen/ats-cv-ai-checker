import { EntityId, Timestamp, UserId } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ActivityContext, type ActivityContextType } from "../../domain/entities/activity-context.entity";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";

export interface HandleActivityContextSuggestionInput {
  userId: string;
  action: "promote" | "hide";
  type: ActivityContextType;
  name: string;
  roleOrLabel: string | null;
}

export class HandleActivityContextSuggestionUseCase {
  constructor(
    private readonly deps: {
      activityContextRepo: ActivityContextRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    input: HandleActivityContextSuggestionInput
  ): Promise<{ ok: true } | ActivityContext> {
    const userId = UserId.fromPrimitives(input.userId);
    if (input.action === "hide") {
      await this.deps.activityContextRepo.hideSuggestion(userId, input);
      await this.deps.tracker.record({
        userId: input.userId,
        requestId: createRequestId("actx-sug"),
        stage: "activity_context_suggestion_hide",
        status: "success",
        metadata: { type: input.type, name: input.name },
      });
      return { ok: true };
    }

    const requestId = createRequestId("actx-sug");
    await this.deps.tracker.record({
      userId: input.userId,
      requestId,
      stage: "activity_context_suggestion_promote",
      status: "started",
    });
    const now = new Date().toISOString();
    const context = await this.deps.activityContextRepo.save(
      ActivityContext.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId,
        type: input.type,
        name: input.name,
        status: "active",
        isDefault: false,
        createdAt: Timestamp.fromPrimitives(now).toPrimitives(),
        updatedAt: Timestamp.fromPrimitives(now).toPrimitives(),
      })
    );
    await this.deps.tracker.record({
      userId: input.userId,
      requestId,
      stage: "activity_context_suggestion_promote",
      status: "success",
      metadata: { contextId: context.id },
    });
    return context;
  }
}

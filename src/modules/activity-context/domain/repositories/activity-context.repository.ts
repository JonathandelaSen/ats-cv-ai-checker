import type { EntityId, UserId } from "@/modules/shared";
import type { ActivityContext } from "../entities/activity-context.entity";

export interface ActivityContextRepository {
  search(userId: UserId): Promise<ActivityContext[]>;
  findById(id: EntityId, userId: UserId): Promise<ActivityContext | null>;
  findDefault(userId: UserId): Promise<ActivityContext | null>;
  save(context: ActivityContext): Promise<ActivityContext>;
  delete(id: EntityId, userId: UserId): Promise<void>;
  listHiddenSuggestionKeys(userId: UserId): Promise<Set<string>>;
  hideSuggestion(userId: UserId, input: { type: string; name: string }): Promise<void>;
  reassignRecordsToDefault(input: {
    userId: UserId;
    sourceContextId: EntityId;
    defaultContextId: EntityId;
  }): Promise<number>;
  countAssignedRecords(id: EntityId, userId: UserId): Promise<number>;
}

import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { CVDataRepository } from "../../domain/repositories/cv-data.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { suggestWorkJournalContextsFromCVs, contextKey } from "../../domain/services/suggest-contexts.service";
import { createRequestId } from "@/lib/observability";

export class EnsureDefaultContextUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      cvDataRepo: CVDataRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(userId: string): Promise<WorkJournalContext | null> {
    const contexts = await this.deps.contextRepo.list(userId);
    const active = contexts.filter((c) => c.status === "active");
    const activeIds = new Set(active.map((c) => c.id));

    const latestContextId = await this.deps.contextRepo.findLatestEntryContextId(userId);

    if (latestContextId && activeIds.has(latestContextId)) {
      const latestContext = active.find((c) => c.id === latestContextId);
      if (latestContext && !latestContext.is_default) {
        return this.deps.contextRepo.update(latestContext.id, userId, {
          is_default: true,
        });
      }
      if (latestContext) return latestContext;
    }

    const currentDefault = active.find((c) => c.is_default);
    if (currentDefault) return currentDefault;
    if (active[0]) return active[0];

    const [cvs, hidden] = await Promise.all([
      this.deps.cvDataRepo.listCVs(userId),
      this.deps.contextRepo.listHiddenSuggestionKeys(userId),
    ]);

    const existing = new Set(contexts.map((c) => contextKey(c.type, c.name)));
    const suggestions = suggestWorkJournalContextsFromCVs(cvs).filter((s) => {
      const key = contextKey(s.type, s.name);
      return !existing.has(key) && !hidden.has(key);
    });

    const best = suggestions[0];
    if (!best) return null;

    const requestId = createRequestId("wj-ctx");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_context_auto_create",
      status: "started",
    });

    const created = await this.deps.contextRepo.create({
      user_id: userId,
      type: best.type,
      name: best.name,
      role_or_label: best.role_or_label,
      is_default: true,
      created_from_cv: true,
    });

    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_context_auto_create",
      status: "success",
      metadata: { contextId: created.id },
    });

    return created;
  }
}

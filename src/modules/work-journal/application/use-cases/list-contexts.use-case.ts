import { UserId } from "@/modules/shared";
import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";

export class ListContextsUseCase {
  constructor(private readonly deps: { contextRepo: WorkJournalContextRepository }) {}

  async execute(userId: string): Promise<WorkJournalContext[]> {
    return this.deps.contextRepo.search({ userId: UserId.fromPrimitives(userId) });
  }
}

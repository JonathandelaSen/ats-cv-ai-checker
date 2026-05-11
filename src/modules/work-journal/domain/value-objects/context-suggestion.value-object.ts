import { ValueObject } from "@/modules/shared";
import { WorkJournalContextName } from "./work-journal-context-name.value-object";
import { type ContextType, WorkJournalContextType } from "./work-journal-context-type.value-object";
import { WorkJournalIsCurrent } from "./work-journal-is-current.value-object";
import { WorkJournalRoleOrLabel } from "./work-journal-role-or-label.value-object";
import { type SuggestionSource, WorkJournalSuggestionSource } from "./work-journal-suggestion-source.value-object";

export interface WorkJournalContextSuggestionPrimitives {
  type: ContextType;
  name: string;
  roleOrLabel: string | null;
  isCurrent: boolean;
  source: SuggestionSource;
}

export class WorkJournalContextSuggestion extends ValueObject<WorkJournalContextSuggestionPrimitives> {
  private constructor(
    private readonly contextType: WorkJournalContextType,
    private readonly contextName: WorkJournalContextName,
    private readonly contextRoleOrLabel: WorkJournalRoleOrLabel,
    private readonly contextIsCurrent: WorkJournalIsCurrent,
    private readonly contextSource: WorkJournalSuggestionSource
  ) {
    super();
  }

  static fromPrimitives(
    primitives: WorkJournalContextSuggestionPrimitives
  ): WorkJournalContextSuggestion {
    return new WorkJournalContextSuggestion(
      WorkJournalContextType.fromPrimitives(primitives.type),
      WorkJournalContextName.fromPrimitives(primitives.name),
      WorkJournalRoleOrLabel.fromPrimitives(primitives.roleOrLabel),
      WorkJournalIsCurrent.fromPrimitives(primitives.isCurrent),
      WorkJournalSuggestionSource.fromPrimitives(primitives.source)
    );
  }

  get type(): ContextType {
    return this.contextType.toPrimitives();
  }

  get name(): string {
    return this.contextName.toPrimitives();
  }

  get roleOrLabel(): string | null {
    return this.contextRoleOrLabel.toPrimitives();
  }

  get isCurrent(): boolean {
    return this.contextIsCurrent.toPrimitives();
  }

  toPrimitives(): WorkJournalContextSuggestionPrimitives {
    return {
      type: this.type,
      name: this.name,
      roleOrLabel: this.roleOrLabel,
      isCurrent: this.isCurrent,
      source: this.contextSource.toPrimitives(),
    };
  }
}

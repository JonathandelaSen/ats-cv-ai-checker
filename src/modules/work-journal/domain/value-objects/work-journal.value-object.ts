import { ValueObject } from "@/modules/shared";

export type ContextType = "employment" | "project";
export type ContextStatus = "active" | "archived";
export type EntryInputMode = "manual" | "ai_assisted";
export type SuggestionSource = "cv";

abstract class NonEmptyStringValueObject extends ValueObject<string> {
  protected constructor(private readonly value: string, label: string) {
    super();
    if (!value.trim()) throw new Error(`${label} cannot be empty.`);
  }

  toPrimitives(): string {
    return this.value;
  }
}

abstract class OptionalStringValueObject extends ValueObject<string | null> {
  protected constructor(private readonly value: string | null) {
    super();
  }

  toPrimitives(): string | null {
    return this.value;
  }
}

abstract class BooleanValueObject extends ValueObject<boolean> {
  protected constructor(private readonly value: boolean) {
    super();
  }

  toPrimitives(): boolean {
    return this.value;
  }
}

export class WorkJournalContextId extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal context id");
  }

  static fromPrimitives(value: string): WorkJournalContextId {
    return new WorkJournalContextId(value);
  }
}

export class WorkJournalEntryId extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal entry id");
  }

  static fromPrimitives(value: string): WorkJournalEntryId {
    return new WorkJournalEntryId(value);
  }
}

export class WorkJournalContextName extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal context name");
  }

  static fromPrimitives(value: string): WorkJournalContextName {
    return new WorkJournalContextName(value);
  }
}

export class WorkJournalRoleOrLabel extends OptionalStringValueObject {
  private constructor(value: string | null) {
    super(value);
  }

  static fromPrimitives(value: string | null): WorkJournalRoleOrLabel {
    return new WorkJournalRoleOrLabel(value?.trim() || null);
  }
}

export class WorkJournalContextType extends ValueObject<ContextType> {
  private constructor(private readonly value: ContextType) {
    super();
  }

  static fromPrimitives(value: ContextType): WorkJournalContextType {
    if (value !== "employment" && value !== "project") {
      throw new Error(`Invalid work journal context type: ${value}`);
    }
    return new WorkJournalContextType(value);
  }

  toPrimitives(): ContextType {
    return this.value;
  }
}

export class WorkJournalContextStatus extends ValueObject<ContextStatus> {
  private constructor(private readonly value: ContextStatus) {
    super();
  }

  static fromPrimitives(value: ContextStatus): WorkJournalContextStatus {
    if (value !== "active" && value !== "archived") {
      throw new Error(`Invalid work journal context status: ${value}`);
    }
    return new WorkJournalContextStatus(value);
  }

  isActive(): boolean {
    return this.value === "active";
  }

  toPrimitives(): ContextStatus {
    return this.value;
  }
}

export class WorkJournalIsDefault extends BooleanValueObject {
  private constructor(value: boolean) {
    super(value);
  }

  static fromPrimitives(value: boolean): WorkJournalIsDefault {
    return new WorkJournalIsDefault(value);
  }
}

export class WorkJournalCreatedFromCv extends BooleanValueObject {
  private constructor(value: boolean) {
    super(value);
  }

  static fromPrimitives(value: boolean): WorkJournalCreatedFromCv {
    return new WorkJournalCreatedFromCv(value);
  }
}

export class WorkJournalDate extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Invalid work journal date: ${value}`);
    }
  }

  static fromPrimitives(value: string): WorkJournalDate {
    return new WorkJournalDate(value);
  }
}

export class WorkJournalOptionalDate extends ValueObject<string | null> {
  private constructor(private readonly value: string | null) {
    super();
    if (value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Invalid work journal optional date: ${value}`);
    }
  }

  static fromPrimitives(value: string | null): WorkJournalOptionalDate {
    return new WorkJournalOptionalDate(value);
  }

  toPrimitives(): string | null {
    return this.value;
  }
}

export class WorkJournalTopic extends OptionalStringValueObject {
  private constructor(value: string | null) {
    super(value);
  }

  static fromPrimitives(value: string | null): WorkJournalTopic {
    return new WorkJournalTopic(value?.trim() || null);
  }
}

export class WorkJournalInputMode extends ValueObject<EntryInputMode> {
  private constructor(private readonly value: EntryInputMode) {
    super();
  }

  static fromPrimitives(value: EntryInputMode): WorkJournalInputMode {
    if (value !== "manual" && value !== "ai_assisted") {
      throw new Error(`Invalid work journal input mode: ${value}`);
    }
    return new WorkJournalInputMode(value);
  }

  toPrimitives(): EntryInputMode {
    return this.value;
  }
}

export class WorkJournalNotes extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal notes");
  }

  static fromPrimitives(value: string): WorkJournalNotes {
    return new WorkJournalNotes(value);
  }
}

export class WorkJournalFinalText extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal final text");
  }

  static fromPrimitives(value: string): WorkJournalFinalText {
    return new WorkJournalFinalText(value);
  }
}

export class WorkJournalTimestamp extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal timestamp");
  }

  static fromPrimitives(value: string): WorkJournalTimestamp {
    return new WorkJournalTimestamp(value);
  }
}

export class WorkJournalIsCurrent extends BooleanValueObject {
  private constructor(value: boolean) {
    super(value);
  }

  static fromPrimitives(value: boolean): WorkJournalIsCurrent {
    return new WorkJournalIsCurrent(value);
  }
}

export class WorkJournalSuggestionSource extends ValueObject<SuggestionSource> {
  private constructor(private readonly value: SuggestionSource) {
    super();
  }

  static fromPrimitives(value: SuggestionSource): WorkJournalSuggestionSource {
    if (value !== "cv") throw new Error(`Invalid suggestion source: ${value}`);
    return new WorkJournalSuggestionSource(value);
  }

  toPrimitives(): SuggestionSource {
    return this.value;
  }
}

export class WorkJournalSuggestionKey extends NonEmptyStringValueObject {
  private constructor(value: string) {
    super(value, "Work journal suggestion key");
  }

  static fromPrimitives(value: string): WorkJournalSuggestionKey {
    return new WorkJournalSuggestionKey(value);
  }
}

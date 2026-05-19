import { ValueObject } from "@/modules/shared";
import type { ActivityContextType } from "../entities/activity-context.entity";

export type ActivityContextSuggestionSource = "cv";

export interface ActivityContextSuggestionPrimitives {
  type: ActivityContextType;
  name: string;
  roleOrLabel: string | null;
  isCurrent: boolean;
  source: ActivityContextSuggestionSource;
}

export class ActivityContextSuggestion extends ValueObject<ActivityContextSuggestionPrimitives> {
  private constructor(private readonly state: ActivityContextSuggestionPrimitives) {
    super();
  }

  static fromPrimitives(
    primitives: ActivityContextSuggestionPrimitives
  ): ActivityContextSuggestion {
    const name = primitives.name.trim();
    if (!name) throw new Error("Activity context suggestion name cannot be empty.");
    if (!["employment", "project", "personal", "other"].includes(primitives.type)) {
      throw new Error("Invalid activity context suggestion type.");
    }
    if (primitives.source !== "cv") {
      throw new Error("Invalid activity context suggestion source.");
    }
    return new ActivityContextSuggestion({
      ...primitives,
      name,
      roleOrLabel: primitives.roleOrLabel?.trim() || null,
    });
  }

  get type(): ActivityContextType {
    return this.state.type;
  }

  get name(): string {
    return this.state.name;
  }

  get roleOrLabel(): string | null {
    return this.state.roleOrLabel;
  }

  get isCurrent(): boolean {
    return this.state.isCurrent;
  }

  toPrimitives(): ActivityContextSuggestionPrimitives {
    return { ...this.state };
  }
}

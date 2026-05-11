import { EntityId } from "./entity-id.value-object";

export class UserId extends EntityId {
  private constructor(value: string) {
    super(value, "User id");
  }

  static fromPrimitives(value: string): UserId {
    return new UserId(value);
  }
}

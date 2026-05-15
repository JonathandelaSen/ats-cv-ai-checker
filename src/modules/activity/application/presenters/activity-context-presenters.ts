import type { ActivityContext } from "../../domain/entities/activity-context.entity";

export function presentActivityContext(context: ActivityContext) {
  return context.toPrimitives();
}

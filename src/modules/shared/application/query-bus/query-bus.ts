import type { Query } from "./query";

export interface QueryBus {
  execute<TResult>(query: Query<unknown, TResult>): Promise<TResult>;
}

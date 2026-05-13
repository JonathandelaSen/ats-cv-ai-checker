import type { Query } from "./query";

export interface QueryHandler<
  TQuery extends Query<unknown, TResult>,
  TResult,
> {
  handle(query: TQuery): Promise<TResult>;
}

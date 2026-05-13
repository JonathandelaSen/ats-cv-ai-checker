import { describe, expectTypeOf, it } from "vitest";
import type { Query } from "./query";
import type { QueryHandler } from "./query-handler";

class TestQuery implements Query<{ readonly value: string }, number> {
  static readonly queryName = "test.query-handler";

  readonly queryName = TestQuery.queryName;

  constructor(public readonly payload: { readonly value: string }) {}
}

describe("QueryHandler", () => {
  it("handles a concrete query and resolves its result type", () => {
    const handler: QueryHandler<TestQuery, number> = {
      async handle(query) {
        return query.payload.value.length;
      },
    };

    expectTypeOf(handler.handle(new TestQuery({ value: "abc" }))).toEqualTypeOf<
      Promise<number>
    >();
  });
});

import { describe, expectTypeOf, it } from "vitest";
import type { Query } from "./query";

describe("Query", () => {
  it("carries a query name and payload typed with its result", () => {
    interface Payload {
      readonly id: string;
    }

    const query: Query<Payload, number> = {
      queryName: "test.query",
      payload: { id: "id-1" },
    };

    expectTypeOf(query.payload).toEqualTypeOf<Payload>();
    expectTypeOf<Query<Payload, number>>().toHaveProperty("queryName").toEqualTypeOf<string>();
  });
});

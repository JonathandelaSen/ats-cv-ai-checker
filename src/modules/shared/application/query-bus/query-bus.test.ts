import { describe, expect, it } from "vitest";
import type { Query } from "./query";
import type { QueryBus } from "./query-bus";

describe("QueryBus", () => {
  it("executes a query and resolves its declared result type", async () => {
    const bus: QueryBus = {
      async execute<TResult>() {
        return "result" as TResult;
      },
    };

    const result = bus.execute<string>({
      queryName: "test.query",
      payload: {},
    } satisfies Query<Record<string, never>, string>);

    const typedResult: Promise<string> = result;
    await expect(typedResult).resolves.toBe("result");
  });
});

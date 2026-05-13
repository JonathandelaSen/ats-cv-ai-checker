import { describe, expect, it } from "vitest";
import { InMemoryQueryBus } from "./in-memory-query-bus";
import { UnregisteredQueryHandlerError } from "./unregistered-query-handler.error";
import type { Query } from "./query";
import type { QueryHandler } from "./query-handler";

interface TestQueryPayload {
  readonly value: string;
}

class TestQuery implements Query<TestQueryPayload, string> {
  static readonly queryName = "test.query";

  readonly queryName = TestQuery.queryName;

  constructor(public readonly payload: TestQueryPayload) {}
}

class OtherQuery implements Query<Record<string, never>, string> {
  static readonly queryName = "test.other-query";

  readonly queryName = OtherQuery.queryName;

  constructor(public readonly payload: Record<string, never> = {}) {}
}

describe("InMemoryQueryBus", () => {
  it("executes the handler registered for the query name", async () => {
    const bus = new InMemoryQueryBus();
    const handledPayloads: TestQueryPayload[] = [];
    const handler: QueryHandler<TestQuery, string> = {
      async handle(query) {
        handledPayloads.push(query.payload);
        return `handled:${query.payload.value}`;
      },
    };

    bus.register(TestQuery.queryName, handler);

    await expect(bus.execute(new TestQuery({ value: "one" }))).resolves.toBe(
      "handled:one"
    );
    expect(handledPayloads).toEqual([{ value: "one" }]);
  });

  it("throws a named error when no handler is registered", async () => {
    const bus = new InMemoryQueryBus();

    await expect(bus.execute(new OtherQuery())).rejects.toThrow(
      new UnregisteredQueryHandlerError(OtherQuery.queryName)
    );
  });

  it("rejects duplicate handler registration for a query name", () => {
    const bus = new InMemoryQueryBus();
    const handler: QueryHandler<TestQuery, string> = {
      async handle() {
        return "ok";
      },
    };

    bus.register(TestQuery.queryName, handler);

    expect(() => bus.register(TestQuery.queryName, handler)).toThrow(
      `Query handler already registered for "${TestQuery.queryName}".`
    );
  });
});

import { describe, expect, it } from "vitest";
import { UnregisteredQueryHandlerError } from "./unregistered-query-handler.error";

describe("UnregisteredQueryHandlerError", () => {
  it("names the missing query handler", () => {
    const error = new UnregisteredQueryHandlerError("sales.get-sale");

    expect(error.name).toBe("UnregisteredQueryHandlerError");
    expect(error.message).toBe('No query handler registered for "sales.get-sale".');
  });
});

import { describe, expect, it } from "vitest";
import { SupabaseActivityContextRepository } from "./supabase-activity-context.repository";

describe("SupabaseActivityContextRepository", () => {
  it("can be instantiated without constructor dependencies", () => {
    expect(new SupabaseActivityContextRepository()).toBeInstanceOf(SupabaseActivityContextRepository);
  });
});

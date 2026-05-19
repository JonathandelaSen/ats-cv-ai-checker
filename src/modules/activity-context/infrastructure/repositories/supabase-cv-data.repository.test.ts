import { describe, expect, it } from "vitest";
import { SupabaseCVDataRepository } from "./supabase-cv-data.repository";

describe("SupabaseCVDataRepository", () => {
  it("can be constructed without a Supabase client", () => {
    expect(new SupabaseCVDataRepository()).toBeInstanceOf(SupabaseCVDataRepository);
  });
});

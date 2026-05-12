import { describe, expect, it } from "vitest";
import { SupabaseCommitmentContextRepository } from "./supabase-commitment-context.repository";

describe("SupabaseCommitmentContextRepository", () => {
  it("is available for module composition", () => {
    expect(SupabaseCommitmentContextRepository).toBeDefined();
  });
});

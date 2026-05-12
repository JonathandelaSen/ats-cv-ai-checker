import { describe, expect, it } from "vitest";
import { SupabaseCommitmentOutcomeRepository } from "./supabase-commitment-outcome.repository";

describe("SupabaseCommitmentOutcomeRepository", () => {
  it("is available for module composition", () => {
    expect(SupabaseCommitmentOutcomeRepository).toBeDefined();
  });
});

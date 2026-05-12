import { describe, expect, it } from "vitest";
import { SupabaseCommitmentRepository } from "./supabase-commitment.repository";

describe("SupabaseCommitmentRepository", () => {
  it("is available for module composition", () => {
    expect(SupabaseCommitmentRepository).toBeDefined();
  });
});

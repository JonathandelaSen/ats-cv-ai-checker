import { describe, expect, it } from "vitest";
import { SupabaseCommitmentItemRepository } from "./supabase-commitment-item.repository";

describe("SupabaseCommitmentItemRepository", () => {
  it("is available for module composition", () => {
    expect(SupabaseCommitmentItemRepository).toBeDefined();
  });
});

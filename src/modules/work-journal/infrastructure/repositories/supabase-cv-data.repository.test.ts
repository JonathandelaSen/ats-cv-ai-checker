import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { createCV } from "@/lib/db";
import { SupabaseCVDataRepository } from "./supabase-cv-data.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseCVDataRepository();
repo.bindRequest(supabase);

describe("SupabaseCVDataRepository", () => {
  it("listCVs delegates to the existing CV listing query", async () => {
    const user = await createTestUser("wj-cv-data");
    const name = testLabel("cv");
    const profile = {
      experience: [{ company: "Acme", role: "Developer" }],
      projects: [{ name: "Workbench" }],
    };

    await createCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      filename: `${name}.pdf`,
      file_size: 1234,
      pdf_storage_path: `${user.id}/${name}.pdf`,
      profile,
    });

    const result = await repo.listCVs(user.id);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name,
      filename: `${name}.pdf`,
      type: "uploaded",
      profile,
    });
  });
});

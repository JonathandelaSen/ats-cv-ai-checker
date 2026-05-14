import { describe, expect, it } from "vitest";
import { createTestJobMatchAnalysis } from "@/modules/test-helpers/analysis-fixtures";
import { createTestCV } from "@/modules/test-helpers/cv-fixtures";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { SupabaseFollowUpRepository } from "./supabase-follow-up.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseFollowUpRepository();
repo.bindRequest(supabase);

describe("SupabaseFollowUpRepository", () => {
  it("finds and saves follow-ups by source analysis", async () => {
    const user = await createTestUser("selection-follow-up");
    const cv = await createTestCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("cv"),
      filename: "cv.pdf",
      file_size: 100,
      pdf_storage_path: null,
    });
    const analysis = await createTestJobMatchAnalysis(supabase, {
      id: crypto.randomUUID(),
      userId: user.id,
      cvId: cv.id,
      title: "Offer",
      filename: "cv.pdf",
    });

    const found = await repo.findBySourceJobMatchAnalysisId(
      analysis.id,
      UserId.fromPrimitives(user.id),
    );

    expect(found?.toPrimitives()).toMatchObject({
      sourceJobMatchAnalysisId: analysis.id,
      status: "interesante",
    });

    found?.update({
      status:
        await import("../../domain/value-objects/follow-up-status.value-object").then(
          (mod) => mod.FollowUpStatus.fromPrimitives("aplicado"),
        ),
      notes: "Sent",
      nextAction: "Follow up",
      nextActionAt: null,
      updatedAt: await import("@/modules/shared").then((mod) =>
        mod.Timestamp.fromPrimitives("2026-05-13T11:00:00.000Z"),
      ),
    });
    const saved = await repo.save(found!);
    expect(saved.toPrimitives().status).toBe("aplicado");
  });
});

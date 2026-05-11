import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
} from "@/modules/test-helpers/setup";
import { SupabaseEventTracker } from "./supabase-event-tracker.repository";

const supabase = getSupabaseClient();

describe("SupabaseEventTracker", () => {
  it("records a processing event", async () => {
    const user = await createTestUser("event-tracker");
    const tracker = new SupabaseEventTracker();
    const requestId = `test_${crypto.randomUUID()}`;

    await tracker.record({
      userId: user.id,
      requestId,
      stage: "ddd_tracker_test",
      status: "success",
      metadata: { source: "ddd-check" },
    });

    const { data, error } = await supabase
      .from("processing_events")
      .select("user_id,request_id,stage,status,metadata")
      .eq("request_id", requestId)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      user_id: user.id,
      request_id: requestId,
      stage: "ddd_tracker_test",
      status: "success",
      metadata: { source: "ddd-check" },
    });
  });
});

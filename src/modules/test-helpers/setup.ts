import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { vi, type Mock } from "vitest";
import {
  createConfirmedUser,
  e2eEnv,
  type E2EUser,
} from "../../../e2e/helpers/supabase";
import { uniqueLabel } from "../../../e2e/helpers/env";
import type {
  EventTracker,
  ProcessingEventInput,
} from "@/modules/shared/domain/repositories/event-tracker.repository";

export const supabase = createClient(
  e2eEnv.supabaseUrl,
  e2eEnv.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

process.env.NEXT_PUBLIC_SUPABASE_URL = e2eEnv.supabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = e2eEnv.anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = e2eEnv.serviceRoleKey;

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export async function createTestUser(prefix = "backend"): Promise<E2EUser> {
  return createConfirmedUser(prefix);
}

export async function getDefaultActivityContextId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("activity_contexts")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .single();
  if (error) throw error;
  return data.id as string;
}

export function testLabel(prefix: string): string {
  return uniqueLabel(prefix);
}

export function createMockTracker(): EventTracker & {
  record: Mock<(event: ProcessingEventInput) => Promise<void>>;
} {
  return {
    record: vi.fn(async () => undefined),
  };
}

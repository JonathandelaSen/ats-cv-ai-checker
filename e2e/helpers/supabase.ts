import { createClient } from "@supabase/supabase-js";
import { getE2EEnv, uniqueLabel } from "./env";

export const e2eEnv = getE2EEnv();

export const adminClient = createClient(
  e2eEnv.supabaseUrl,
  e2eEnv.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export interface E2EUser {
  id: string;
  email: string;
  password: string;
}

export async function createConfirmedUser(prefix = "e2e"): Promise<E2EUser> {
  const password = "local-e2e-password";
  const email = `${uniqueLabel(prefix)}@example.com`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return the created user.");

  return {
    id: data.user.id,
    email,
    password,
  };
}

export async function getProcessingEvents(filter: {
  userId?: string;
  cvId?: string;
  analysisId?: string;
}) {
  let query = adminClient
    .from("processing_events")
    .select("id,user_id,cv_id,analysis_id,stage,status,source,error_code")
    .order("created_at", { ascending: true });

  if (filter.userId) query = query.eq("user_id", filter.userId);
  if (filter.cvId) query = query.eq("cv_id", filter.cvId);
  if (filter.analysisId) query = query.eq("analysis_id", filter.analysisId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

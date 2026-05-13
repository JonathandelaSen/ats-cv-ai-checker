import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseAware {
  bindRequest(client: SupabaseClient): void;
}

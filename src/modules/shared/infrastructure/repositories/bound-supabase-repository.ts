import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseAware } from "../supabase-aware";

export abstract class BoundSupabaseRepository implements SupabaseAware {
  private supabase: SupabaseClient | null = null;

  bindRequest(client: SupabaseClient): void {
    this.supabase = client;
  }

  protected get client(): SupabaseClient {
    if (!this.supabase) {
      throw new Error(`${this.constructor.name} must be bound to a Supabase client`);
    }
    return this.supabase;
  }
}

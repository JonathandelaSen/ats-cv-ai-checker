import type { SupabaseClient } from "@supabase/supabase-js";
import { listCVs } from "@/lib/db";
import type {
  CVDataRepository,
  CVSummaryForSuggestions,
} from "../../domain/repositories/cv-data.repository";

export class SupabaseCVDataRepository implements CVDataRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listCVs(userId: string): Promise<CVSummaryForSuggestions[]> {
    return listCVs(this.supabase, userId);
  }
}

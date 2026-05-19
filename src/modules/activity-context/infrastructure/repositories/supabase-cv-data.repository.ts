import { normalizeStandardCVProfile } from "@/lib/cv-profile";
import { BoundSupabaseRepository } from "@/modules/shared";
import type {
  CVDataRepository,
  CVSummaryForActivityContextSuggestions,
} from "../../domain/repositories/cv-data.repository";

export class SupabaseCVDataRepository
  extends BoundSupabaseRepository
  implements CVDataRepository
{
  async listCVs(userId: string): Promise<CVSummaryForActivityContextSuggestions[]> {
    const { data, error } = await this.client
      .from("cvs")
      .select("type, profile, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      type: row.type as string,
      profile: row.profile ? normalizeStandardCVProfile(row.profile) : null,
    }));
  }
}

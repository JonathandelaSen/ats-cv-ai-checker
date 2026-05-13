import { BoundSupabaseRepository } from "@/modules/shared";
import { listCVs } from "@/lib/db";
import type {
  CVDataRepository,
  CVSummaryForSuggestions,
} from "../../domain/repositories/cv-data.repository";

export class SupabaseCVDataRepository extends BoundSupabaseRepository implements CVDataRepository {

  async listCVs(userId: string): Promise<CVSummaryForSuggestions[]> {
    return listCVs(this.client, userId);
  }
}

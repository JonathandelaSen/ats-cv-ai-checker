import type { StandardCVProfile } from "@/lib/cv-profile";

export interface CVSummaryForActivityContextSuggestions {
  type: string;
  profile: StandardCVProfile | null;
}

export interface CVDataRepository {
  listCVs(userId: string): Promise<CVSummaryForActivityContextSuggestions[]>;
}

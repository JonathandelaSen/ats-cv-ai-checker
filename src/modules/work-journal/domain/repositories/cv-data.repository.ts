import type { StandardCVProfile } from "@/lib/cv-profile";

export interface CVSummaryForSuggestions {
  name?: string;
  filename?: string | null;
  type: string;
  profile: StandardCVProfile | null;
}

export interface CVDataRepository {
  listCVs(userId: string): Promise<CVSummaryForSuggestions[]>;
}

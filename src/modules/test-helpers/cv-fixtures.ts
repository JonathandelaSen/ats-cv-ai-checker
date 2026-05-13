import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeStandardCVProfile,
  type StandardCVProfile,
} from "@/lib/cv-profile";
import type { ExtractedPdfText } from "@/lib/pdf-extraction";

export interface TestCVRecord extends ExtractedPdfText {
  id: string;
  user_id: string;
  name: string;
  filename: string | null;
  file_size: number | null;
  pdf_storage_path: string | null;
  type: "uploaded" | "template";
  source_cv_id: string | null;
  template_id: string | null;
  template_locale: string | null;
  schema_version: string | null;
  source_text_hash: string | null;
  ai_model: string | null;
  profile: StandardCVProfile | null;
  public_enabled: boolean;
  public_id: string | null;
  public_slug: string | null;
  public_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTestCVInput extends Partial<ExtractedPdfText> {
  id: string;
  user_id: string;
  name: string;
  filename?: string | null;
  file_size?: number | null;
  pdf_storage_path?: string | null;
  type?: "uploaded" | "template";
  source_cv_id?: string | null;
  template_id?: string | null;
  template_locale?: string | null;
  schema_version?: string | null;
  source_text_hash?: string | null;
  ai_model?: string | null;
  profile?: StandardCVProfile | null;
}

export async function createTestCV(
  supabase: SupabaseClient,
  input: CreateTestCVInput,
): Promise<TestCVRecord> {
  const { data, error } = await supabase
    .from("cvs")
    .insert({
      id: input.id,
      user_id: input.user_id,
      name: input.name,
      filename: input.filename ?? null,
      file_size: input.file_size ?? null,
      pdf_storage_path: input.pdf_storage_path ?? null,
      type: input.type ?? "uploaded",
      source_cv_id: input.source_cv_id ?? null,
      template_id: input.template_id ?? null,
      template_locale: input.template_locale ?? null,
      schema_version: input.schema_version ?? null,
      source_text_hash: input.source_text_hash ?? null,
      ai_model: input.ai_model ?? null,
      profile: input.profile ?? null,
      text_python: input.text_python ?? null,
      text_pdfjs: input.text_pdfjs ?? null,
      text_node: input.text_node ?? null,
      extract_error_python: input.extract_error_python ?? null,
      extract_error_pdfjs: input.extract_error_pdfjs ?? null,
      extract_error_node: input.extract_error_node ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return {
    ...(data as Omit<TestCVRecord, "profile">),
    profile: data.profile ? normalizeStandardCVProfile(data.profile) : null,
  };
}

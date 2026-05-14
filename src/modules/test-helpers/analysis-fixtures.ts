import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createCVAnalysisModule,
  presentCVAnalysis,
} from "@/modules/cv-analysis";
import {
  createJobMatchAnalysisModule,
  presentJobMatchAnalysis,
} from "@/modules/job-match-analysis";

export async function createTestCVAnalysis(
  supabase: SupabaseClient,
  input: {
    id: string;
    userId: string;
    cvId: string | null;
    title: string;
    filename?: string;
    text?: string | null;
  },
) {
  const cvAnalysisModule = createCVAnalysisModule();
  cvAnalysisModule.bindRequest(supabase);

  const entity = await cvAnalysisModule.createCVAnalysis.execute({
    id: input.id,
    userId: input.userId,
    cvDocumentId: input.cvId,
    title: input.title,
    filename: input.filename ?? "cv.pdf",
    fileSize: null,
    pdfStoragePath: null,
    extractedText: {
      textPython: input.text ?? null,
      textPdfjs: null,
      textNode: null,
      extractErrorPython: null,
      extractErrorPdfjs: null,
      extractErrorNode: null,
    },
    aiModel: null,
    aiContext: null,
  });

  return presentCVAnalysis(entity);
}

export async function createTestJobMatchAnalysis(
  supabase: SupabaseClient,
  input: {
    id: string;
    userId: string;
    cvId: string;
    title: string;
    filename?: string;
    text?: string | null;
    score?: number | null;
  },
) {
  const jobMatchAnalysisModule = createJobMatchAnalysisModule();
  jobMatchAnalysisModule.bindRequest(supabase);

  const entity = await jobMatchAnalysisModule.createJobMatchAnalysis.execute({
    id: input.id,
    userId: input.userId,
    cvDocumentId: input.cvId,
    title: input.title,
    filename: input.filename ?? "cv.pdf",
    fileSize: 100,
    pdfStoragePath: null,
    extractedText: {
      textPython: input.text ?? "Analysis text",
      textPdfjs: null,
      textNode: null,
      extractErrorPython: null,
      extractErrorPdfjs: null,
      extractErrorNode: null,
    },
    aiModel: "model",
    jobDescription: "Job",
    jobUrl: null,
  });

  if (typeof input.score === "number") {
    const scored = await jobMatchAnalysisModule.updateJobMatchAnalysisAIResult.execute({
      id: entity.toPrimitives().id,
      userId: input.userId,
      aiModel: "model",
      jobDescription: "Job",
      jobUrl: null,
      score: input.score,
      feedback: "Good",
      aiKeywords: ["ts"],
      improvements: ["more"],
      jobKeyData: null,
      jobKeywords: [],
      cvKeywords: ["ts"],
      matchingKeywords: ["ts"],
      missingKeywords: [],
    });
    return scored ? presentJobMatchAnalysis(scored) : presentJobMatchAnalysis(entity);
  }

  return presentJobMatchAnalysis(entity);
}

import { NextRequest, NextResponse } from "next/server";
import type { AIContext } from "@/lib/analysis-types";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { createClient } from "@/lib/supabase/server";
import { cvAnalysisModule } from "@/lib/container";
import {
  presentCVAnalysis,
  presentCVAnalysisSummary,
} from "@/modules/cv-analysis";
import { prepareAnalysisInput } from "../analysis-helpers/create-analysis-input";

const ROUTE_SOURCE = "api_cv_analyses";

async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analyses = await cvAnalysisModule
      .bindRequest(supabase)
      .listCVAnalyses.execute({ userId: user.id });
    return NextResponse.json(analyses.map(presentCVAnalysisSummary));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("cv_analysis");
  let userId: string | null = null;
  let cvIdForEvents: string | null = null;
  let analysisIdForEvents: string | null = null;

  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    const {
      cvId,
      title,
      context,
      model = "gemini-3.1-pro-preview",
    } = (await req.json()) as {
      cvId?: string;
      title?: string;
      context?: AIContext;
      model?: string;
    };

    const trimmedTitle = title?.trim();
    if (!cvId) {
      return NextResponse.json({ error: "cvId is required" }, { status: 400 });
    }
    cvIdForEvents = cvId;
    if (!trimmedTitle) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const prepared = await prepareAnalysisInput({
      supabase,
      userId: user.id,
      cvId,
      requestId,
      source: ROUTE_SOURCE,
    });
    if (!prepared) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    if (!prepared.analysisText) {
      await recordProcessingEvent({
        userId,
        cvId,
        requestId,
        stage: "analysis_preflight",
        status: "error",
        source: ROUTE_SOURCE,
        fileSize: prepared.extractionDiagnostics.fileSize,
        errorCode: "no_extracted_text_available",
        errorMessage: "No extracted text available for this CV.",
        metadata: prepared.extractionDiagnostics,
      });
      return NextResponse.json(
        { error: "No extracted text available for this CV" },
        { status: 400 },
      );
    }

    analysisIdForEvents = crypto.randomUUID();
    const persistStartedAt = performance.now();
    await recordProcessingEvent({
      userId,
      cvId,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "analysis_persist",
      status: "started",
      source: ROUTE_SOURCE,
      metadata: {
        mode: "general",
        model,
      },
    });

    const analysis = presentCVAnalysis(
      await cvAnalysisModule
        .bindRequest(supabase)
        .createCVAnalysis.execute({
          id: analysisIdForEvents,
          userId: user.id,
          cvDocumentId: prepared.cv.id,
          title: trimmedTitle,
          filename: prepared.filename,
          fileSize: prepared.fileSize,
          pdfStoragePath: prepared.cv.pdf_storage_path,
          extractedText: prepared.extractedText,
          aiModel: model,
          aiContext: context ?? null,
        }),
    );

    await recordProcessingEvent({
      userId,
      cvId,
      analysisId: analysis.id,
      requestId,
      stage: "analysis_persist",
      status: "success",
      source: ROUTE_SOURCE,
      durationMs: performance.now() - persistStartedAt,
      metadata: {
        mode: "general",
        model,
        score: analysis.ai_score,
      },
    });

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Create CV analysis error:", error);
    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "analysis_request",
      status: "error",
      source: ROUTE_SOURCE,
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return NextResponse.json(
      { error: "Failed to create CV analysis", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boundCVAnalysisModule = cvAnalysisModule.bindRequest(supabase);
    const analyses = await boundCVAnalysisModule.listCVAnalyses.execute({
      userId: user.id,
    });
    await Promise.all(
      analyses.map((analysis) =>
        boundCVAnalysisModule.deleteCVAnalysis.execute({
          id: analysis.toPrimitives().id,
          userId: user.id,
        }),
      ),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

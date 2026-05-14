import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { createClient } from "@/lib/supabase/server";
import { cvLibraryModule, jobMatchAnalysisModule } from "@/lib/container";
import {
  presentJobMatchAnalysis,
  presentJobMatchAnalysisSummary,
} from "@/modules/job-match-analysis";

const ROUTE_SOURCE = "api_job_match_analyses";

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

    const analyses = await jobMatchAnalysisModule
      .bindRequest(supabase)
      .listJobMatchAnalyses.execute({ userId: user.id });
    return NextResponse.json(analyses.map(presentJobMatchAnalysisSummary));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("job_match_analysis");
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
      jobDescription,
      jobUrl,
      model = "gemini-3.1-pro-preview",
    } = (await req.json()) as {
      cvId?: string;
      title?: string;
      jobDescription?: string;
      jobUrl?: string;
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
    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { error: "Job description is required for job match analysis" },
        { status: 400 },
      );
    }

    const prepared = await cvLibraryModule
      .bindRequest(supabase)
      .prepareCVAnalysisInput.execute({
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
        mode: "job_match",
        model,
      },
    });

    const analysis = presentJobMatchAnalysis(
      await jobMatchAnalysisModule
        .bindRequest(supabase)
        .createJobMatchAnalysis.execute({
          id: analysisIdForEvents,
          userId: user.id,
          cvDocumentId: prepared.cv.id,
          title: trimmedTitle,
          filename: prepared.filename,
          fileSize: prepared.fileSize,
          pdfStoragePath: prepared.pdfStoragePath,
          extractedText: prepared.extractedText,
          aiModel: model,
          jobDescription: jobDescription.trim(),
          jobUrl: jobUrl?.trim() || null,
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
        mode: "job_match",
        model,
        score: analysis.ai_score,
      },
    });

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Create job match analysis error:", error);
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
      {
        error: "Failed to create job match analysis",
        details: getErrorMessage(error),
      },
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

    const boundJobMatchAnalysisModule =
      jobMatchAnalysisModule.bindRequest(supabase);
    const analyses = await boundJobMatchAnalysisModule.listJobMatchAnalyses.execute({
      userId: user.id,
    });
    await Promise.all(
      analyses.map((analysis) =>
        boundJobMatchAnalysisModule.deleteJobMatchAnalysis.execute({
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

import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { cvLibraryModule } from "@/lib/container";
import { presentCVDocument } from "@/modules/cv-library";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = (await req.json()) as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Proporciona un nombre para el nuevo CV." },
        { status: 400 }
      );
    }

    const templateDocument = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id, userId: user.id });
    const templateCV = templateDocument ? presentCVDocument(templateDocument) : null;
    if (!templateCV || templateCV.type !== "template" || !templateCV.profile) {
      return NextResponse.json({ error: "Template CV not found" }, { status: 404 });
    }

    const summaryText = templateCV.profile.summary || "";
    const expText = (templateCV.profile.experience || []).map(e => `${e.company} ${e.role}`).join(" ");

    const newCV = await cvLibraryModule
      .bindRequest(supabase)
      .createTemplateCVDocument.execute({
      userId: user.id,
      name: name.trim(),
      sourceCvId: templateCV.id,
      profile: templateCV.profile,
      filename: `version-${templateCV.template_id}.json`,
      templateId: templateCV.template_id ?? "",
      templateLocale: templateCV.template_locale ?? "es",
      schemaVersion: templateCV.schema_version ?? "",
      sourceTextHash: templateCV.source_text_hash ?? "",
      aiModel: templateCV.ai_model ?? "",
      textNode: `${summaryText} ${expText}`,
      requestId: `save-as-cv-${id}`,
    });

    const structured = await cvLibraryModule
      .bindRequest(supabase)
      .upsertCVStructuredProfile.execute({
      userId: user.id,
      cvDocumentId: newCV.id,
      sourceTextHash: templateCV.source_text_hash ?? "",
      aiModel: templateCV.ai_model ?? "",
      profile: templateCV.profile,
      requestId: `save-as-cv-profile-${id}`,
    });
    void structured;

    return NextResponse.json({ cv: presentCVDocument(newCV) });
  } catch (error: unknown) {
    console.error("Save template as CV error:", error);
    return NextResponse.json(
      { error: "Failed to save as CV", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

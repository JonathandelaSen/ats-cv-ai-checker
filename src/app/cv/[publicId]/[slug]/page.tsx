import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { cache } from "react";
import CVTemplatePreview from "@/components/cv-template-preview";
import { cvLibraryModule } from "@/lib/container";
import { buildPublicCVPath } from "@/lib/public-cv";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCVTemplate, type CVTemplateId, type CVTemplateLocale } from "@/lib/cv-templates";
import { presentCVDocument } from "@/modules/cv-library";

type PublicCVPageProps = {
  params: Promise<{
    publicId: string;
    slug: string;
  }>;
};

const getPublicCV = cache(async (publicId: string) => {
  const supabase = createAdminClient();
  const cv = await cvLibraryModule
    .bindRequest(supabase)
    .getPublishedCVDocument.execute({ publicId });
  return cv ? presentCVDocument(cv) : null;
});

export async function generateMetadata({
  params,
}: PublicCVPageProps): Promise<Metadata> {
  const { publicId } = await params;
  const cv = await getPublicCV(publicId);
  const name = cv?.profile?.basics?.name ?? cv?.name ?? "CV público";

  return {
    title: `${name} | ATS CV AI Checker`,
    description: "CV público creado y compartido desde ATS CV AI Checker.",
    robots: { index: false, follow: false },
  };
}

export default async function PublicCVPage({ params }: PublicCVPageProps) {
  const { publicId, slug } = await params;
  const cv = await getPublicCV(publicId);

  if (!cv?.profile || !cv.template_id || !cv.public_slug || !cv.public_id) {
    notFound();
  }

  if (slug !== cv.public_slug) {
    notFound();
  }

  const template = getCVTemplate(cv.template_id);
  if (!template) {
    notFound();
  }

  const locale = template.locales.includes(cv.template_locale as CVTemplateLocale)
    ? (cv.template_locale as CVTemplateLocale)
    : "es";

  return (
    <main className="public-cv-page min-h-screen bg-[#f4f1ec] text-zinc-950">
      <header className="border-b border-zinc-200/80 bg-[#f4f1ec]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-sm font-bold tracking-tight text-zinc-950">
            ATS CV AI Checker
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`${buildPublicCVPath(cv.public_id, cv.public_slug)}/pdf`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white/70 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-white hover:text-zinc-950"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Descargar PDF</span>
              <span className="sm:hidden">PDF</span>
            </a>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-white hover:text-zinc-950"
            >
              Crear mi CV
            </Link>
          </div>
        </div>
      </header>

      <section className="public-cv-stage mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:py-10">
        <div className="public-cv-document">
          <CVTemplatePreview
            profile={cv.profile}
            templateId={template.templateId as CVTemplateId}
            locale={locale}
          />
        </div>
      </section>
    </main>
  );
}

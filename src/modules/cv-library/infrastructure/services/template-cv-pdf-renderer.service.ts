import { renderTemplatePDF } from "@/lib/cv-template-pdf";
import type { CVTemplatePdfRenderer } from "../../domain/repositories/cv-analysis-preparation-services";

export class TemplateCVPdfRenderer implements CVTemplatePdfRenderer {
  async render(
    input: Parameters<CVTemplatePdfRenderer["render"]>[0],
  ): Promise<Buffer> {
    return renderTemplatePDF(input);
  }
}

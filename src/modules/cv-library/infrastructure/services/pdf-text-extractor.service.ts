import { extractPdfText } from "@/lib/pdf-extraction";
import type { CVDocumentExtractedTextPrimitives } from "../../domain/entities/cv-document.entity";
import type {
  CVPdfTextExtractionContext,
  CVPdfTextExtractor,
} from "../../domain/repositories/cv-analysis-preparation-services";

export class PdfTextExtractor implements CVPdfTextExtractor {
  async extract(
    buffer: Buffer,
    context: CVPdfTextExtractionContext,
  ): Promise<CVDocumentExtractedTextPrimitives> {
    const extracted = await extractPdfText(buffer, context);
    return {
      textPython: extracted.text_python,
      textPdfjs: extracted.text_pdfjs,
      textNode: extracted.text_node,
      extractErrorPython: extracted.extract_error_python,
      extractErrorPdfjs: extracted.extract_error_pdfjs,
      extractErrorNode: extracted.extract_error_node,
    };
  }
}

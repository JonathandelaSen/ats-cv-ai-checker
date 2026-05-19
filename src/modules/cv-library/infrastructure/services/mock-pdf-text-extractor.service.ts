import type { CVDocumentExtractedTextPrimitives } from "../../domain/entities/cv-document.entity";
import type {
  CVPdfTextExtractionContext,
  CVPdfTextExtractor,
} from "../../domain/repositories/cv-analysis-preparation-services";

export class MockPdfTextExtractor implements CVPdfTextExtractor {
  async extract(
    _buffer: Buffer,
    _context: CVPdfTextExtractionContext,
  ): Promise<CVDocumentExtractedTextPrimitives> {
    const mockText = [
      "MOCK EXTRACTED CV TEXT",
      "",
      "Name: Test User | Email: test@example.com",
      "Location: Madrid, Spain",
      "",
      "EXPERIENCE:",
      "Senior Software Engineer at Tech Corp (2020 - Present)",
      "- Led migration of monolithic application to microservices architecture",
      "- Implemented CI/CD pipelines reducing deployment time by 60%",
      "- Mentored team of 4 junior developers",
      "",
      "Full-Stack Developer at StartupCo (2017 - 2020)",
      "- Built real-time collaboration features using WebSockets",
      "- Designed RESTful APIs serving 50k daily active users",
      "",
      "EDUCATION:",
      "BSc Computer Science - Universidad Politécnica (2013 - 2017)",
      "",
      "SKILLS: TypeScript, React, Node.js, PostgreSQL, Docker, AWS",
    ].join("\n");

    return {
      textPython: null,
      textPdfjs: null,
      textNode: mockText,
      extractErrorPython: null,
      extractErrorPdfjs: null,
      extractErrorNode: null,
    };
  }
}

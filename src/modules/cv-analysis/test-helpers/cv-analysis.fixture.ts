import { faker } from "@faker-js/faker";
import crypto from "node:crypto";
import type { CreateCVAnalysisInput } from "../application/use-cases/create-cv-analysis.use-case";

export class CVAnalysisFixture {
  static createInput(
    overrides: Partial<CreateCVAnalysisInput> = {},
  ): CreateCVAnalysisInput {
    return {
      id: crypto.randomUUID(),
      userId: overrides.userId ?? faker.string.uuid(),
      cvDocumentId: overrides.cvDocumentId ?? null,
      cvStructuredProfileId: overrides.cvStructuredProfileId ?? null,
      title: `Análisis CV - ${faker.person.fullName()}`,
      filename: `cv_${faker.person.lastName().toLowerCase()}.pdf`,
      fileSize: faker.number.int({ min: 20000, max: 500000 }),
      pdfStoragePath: null,
      extractedText: {
        textPython: null,
        textPdfjs: null,
        textNode: faker.lorem.paragraphs(3),
        extractErrorPython: null,
        extractErrorPdfjs: null,
        extractErrorNode: null,
      },
      aiModel: null,
      aiContext: null,
      ...overrides,
    };
  }
}

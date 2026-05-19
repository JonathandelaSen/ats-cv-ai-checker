import { faker } from "@faker-js/faker";
import crypto from "node:crypto";
import type { CreateJobMatchAnalysisInput } from "../application/use-cases/create-job-match-analysis.use-case";

export class JobMatchAnalysisFixture {
  static createInput(
    overrides: Partial<CreateJobMatchAnalysisInput> = {},
  ): CreateJobMatchAnalysisInput {
    return {
      id: crypto.randomUUID(),
      userId: overrides.userId ?? faker.string.uuid(),
      cvDocumentId: overrides.cvDocumentId ?? null,
      cvStructuredProfileId: overrides.cvStructuredProfileId ?? null,
      jobOpportunityId: overrides.jobOpportunityId ?? null,
      title: `Match: ${faker.person.jobTitle()} en ${faker.company.name()}`,
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
      jobDescription: faker.lorem.paragraphs(2),
      jobUrl: faker.internet.url(),
      ...overrides,
    };
  }
}

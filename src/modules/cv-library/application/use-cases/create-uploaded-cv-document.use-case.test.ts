import { describe, expect, it } from "vitest";
import { documentRepo, tracker } from "./cv-library-test-helpers.test";
import { CreateUploadedCVDocumentUseCase } from "./create-uploaded-cv-document.use-case";

describe("CreateUploadedCVDocumentUseCase", () => {
  it("creates an uploaded document and records observability", async () => {
    const repo = documentRepo();
    const events = tracker();
    const result = await new CreateUploadedCVDocumentUseCase({
      documentRepo: repo,
      tracker: events,
    }).execute({
      id: "cv-1",
      userId: "user-1",
      name: "CV",
      filename: "cv.pdf",
      fileSize: 10,
      pdfStoragePath: "user-1/cv.pdf",
      textPython: "text",
      textPdfjs: null,
      textNode: null,
      extractErrorPython: null,
      extractErrorPdfjs: null,
      extractErrorNode: null,
      requestId: "req-1",
    });

    expect(result.toPrimitives()).toMatchObject({ id: "cv-1", type: "uploaded" });
    expect(repo.save).toHaveBeenCalledOnce();
    expect(events.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "cv_library_document_created" })
    );
  });
});

import { UserId } from "@/modules/shared";
import type { CVDocument } from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";

export interface GetCVDocumentInput {
  id: string;
  userId: string;
}

export class GetCVDocumentUseCase {
  constructor(private readonly deps: { documentRepo: CVDocumentRepository }) {}

  async execute(input: GetCVDocumentInput): Promise<CVDocument | null> {
    return this.deps.documentRepo.findById(
      CVDocumentId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
  }
}

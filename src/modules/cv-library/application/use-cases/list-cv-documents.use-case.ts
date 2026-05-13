import { UserId } from "@/modules/shared";
import type { CVDocument } from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";

export interface ListCVDocumentsInput {
  userId: string;
}

export class ListCVDocumentsUseCase {
  constructor(private readonly deps: { documentRepo: CVDocumentRepository }) {}

  async execute(input: ListCVDocumentsInput): Promise<CVDocument[]> {
    return this.deps.documentRepo.search({
      userId: UserId.fromPrimitives(input.userId),
    });
  }
}

import { BoundSupabaseRepository } from "@/modules/shared";
import { CV_PDFS_BUCKET } from "../../domain/services/cv-storage";
import type { CVPdfStorage } from "../../domain/repositories/cv-analysis-preparation-services";

export class SupabaseCVPdfStorage
  extends BoundSupabaseRepository
  implements CVPdfStorage
{
  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(CV_PDFS_BUCKET)
      .download(path);

    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }

  async upload(input: {
    path: string;
    buffer: Buffer;
    contentType: string;
    upsert?: boolean;
  }): Promise<void> {
    const { error } = await this.client.storage
      .from(CV_PDFS_BUCKET)
      .upload(input.path, input.buffer, {
        contentType: input.contentType,
        upsert: input.upsert,
      });

    if (error) throw error;
  }

  async remove(paths: string[]): Promise<void> {
    const { error } = await this.client.storage
      .from(CV_PDFS_BUCKET)
      .remove(paths);

    if (error) throw error;
  }
}

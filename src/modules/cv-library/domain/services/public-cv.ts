export const PUBLIC_CV_SLUG_MAX_LENGTH = 72;
export const PUBLIC_CV_ID_LENGTH = 8;

const PUBLIC_ID_ALPHABET =
  "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export interface PublicCVSettingsRequest {
  public_enabled?: boolean;
  public_slug?: string | null;
  confirmPublicExposure?: boolean;
}

export function normalizePublicCVSlug(value: string | null | undefined) {
  const normalized = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, PUBLIC_CV_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");

  return normalized || null;
}

export function buildPublicCVPath(publicId: string, slug: string) {
  return `/cv/${encodeURIComponent(publicId)}/${encodeURIComponent(slug)}`;
}

export function generatePublicCVId() {
  const bytes = new Uint8Array(PUBLIC_CV_ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length]).join("");
}

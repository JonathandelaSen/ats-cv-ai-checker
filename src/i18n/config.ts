export const INTERFACE_LANGUAGES = ["en", "es"] as const;

export type InterfaceLanguage = (typeof INTERFACE_LANGUAGES)[number];

export const DEFAULT_INTERFACE_LANGUAGE: InterfaceLanguage = "en";
export const INTERFACE_LANGUAGE_COOKIE = "interface-language";

export function isInterfaceLanguage(value: unknown): value is InterfaceLanguage {
  return typeof value === "string" && INTERFACE_LANGUAGES.includes(value as InterfaceLanguage);
}

export function resolveBrowserLanguage(acceptLanguage: string | null): InterfaceLanguage | null {
  if (!acceptLanguage) return null;

  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    if (isInterfaceLanguage(base)) return base;
  }

  return null;
}

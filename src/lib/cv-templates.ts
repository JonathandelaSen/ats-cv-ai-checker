import type { StandardCVProfile } from "@/lib/cv-profile";

export type CVTemplateId = "compact" | "classic" | "modern" | "filo";
export type CVTemplateLocale = "es" | "en";
export type CVRenderableSectionId =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "technicalSkills"
  | "languages"
  | "certifications"
  | "projects"
  | "awards"
  | "publications"
  | "volunteering";

export interface CVPresentationInput {
  presentation?: {
    sectionTitles?: Partial<Record<CVRenderableSectionId, string>>;
    sectionOrder?: CVRenderableSectionId[];
    accentColor?: string;
  };
}

export interface CVTemplateDefinition {
  templateId: CVTemplateId;
  name: string;
  description: string;
  supportedSections: Array<keyof StandardCVProfile>;
  locales: CVTemplateLocale[];
  fixtureProfile: StandardCVProfile;
}

export const CV_RENDERABLE_SECTIONS: CVRenderableSectionId[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "technicalSkills",
  "languages",
  "certifications",
  "projects",
  "awards",
  "publications",
  "volunteering",
];

export const DEFAULT_SECTION_ORDER: CVRenderableSectionId[] = [
  "summary",
  "experience",
  "skills",
  "education",
  "projects",
  "technicalSkills",
  "languages",
  "certifications",
  "awards",
  "publications",
  "volunteering",
];

export const SECTION_LABELS: Record<
  CVTemplateLocale,
  Record<CVRenderableSectionId | "about", string>
> = {
  es: {
    about: "Resumen Profesional",
    summary: "Resumen Profesional",
    experience: "Experiencia",
    education: "Educación",
    skills: "Competencias",
    languages: "Idiomas",
    technicalSkills: "Habilidades técnicas",
    certifications: "Certificaciones",
    projects: "Proyectos",
    awards: "Reconocimientos",
    publications: "Publicaciones",
    volunteering: "Voluntariado",
  },
  en: {
    about: "Summary",
    summary: "Summary",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    technicalSkills: "Technical Skills",
    certifications: "Certifications",
    projects: "Projects",
    awards: "Awards",
    publications: "Publications",
    volunteering: "Volunteering",
  },
};

const TEMPLATE_ACCENT_COLORS: Record<CVTemplateId, string> = {
  compact: "#111827",
  classic: "#1a1a2e",
  modern: "#0f766e",
  filo: "#9f1239",
};

export function isRenderableSectionId(
  value: unknown
): value is CVRenderableSectionId {
  return (
    typeof value === "string" &&
    CV_RENDERABLE_SECTIONS.includes(value as CVRenderableSectionId)
  );
}

export function normalizeSectionOrder(value: unknown): CVRenderableSectionId[] {
  const ordered = Array.isArray(value)
    ? value.filter(isRenderableSectionId)
    : [];
  const unique = Array.from(new Set(ordered));
  const missing = DEFAULT_SECTION_ORDER.filter(
    (section) => !unique.includes(section)
  );
  return [...unique, ...missing];
}

export function normalizeSectionTitles(
  value: unknown
): Partial<Record<CVRenderableSectionId, string>> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const titles: Partial<Record<CVRenderableSectionId, string>> = {};
  for (const [key, rawTitle] of Object.entries(value)) {
    if (!isRenderableSectionId(key) || typeof rawTitle !== "string") continue;
    const customTitle = rawTitle.trim();
    if (customTitle) titles[key] = customTitle;
  }

  return Object.keys(titles).length > 0 ? titles : undefined;
}

export function normalizeAccentColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : undefined;
}

export function getTemplateAccentColor(templateId: CVTemplateId): string {
  return TEMPLATE_ACCENT_COLORS[templateId];
}

export function getResolvedAccentColor(
  profile: CVPresentationInput | null | undefined,
  templateId: CVTemplateId
): string {
  return (
    normalizeAccentColor(profile?.presentation?.accentColor) ??
    getTemplateAccentColor(templateId)
  );
}

export function getOrderedRenderableSections(
  profile: CVPresentationInput | null | undefined
): CVRenderableSectionId[] {
  return normalizeSectionOrder(profile?.presentation?.sectionOrder);
}

export function getSectionTitle(
  section: CVRenderableSectionId,
  locale: string,
  profile?: CVPresentationInput | null
): string {
  const customTitle = profile?.presentation?.sectionTitles?.[section]?.trim();
  if (customTitle) return customTitle;
  const labels = getSectionLabels(locale);
  return labels[section];
}

const loremProfile: StandardCVProfile = {
  basics: {
    name: "Alex Morgan",
    headline: "Senior Product Designer",
    email: "alex.morgan@example.com",
    phone: "+34 600 000 000",
    location: "Madrid, Spain",
    links: [
      { label: "Portfolio", url: "alexmorgan.design" },
      { label: "LinkedIn", url: "linkedin.com/in/alexmorgan" },
    ],
  },
  summary:
    "Product designer focused on accessible systems, research-led decisions, and measurable customer outcomes across B2B platforms.",
  experience: [
    {
      role: "Senior Product Designer",
      company: "Northstar Labs",
      location: "Remote",
      dates: { start: "2022", end: "Present", current: true },
      bullets: [
        "Led discovery and design for a multi-market onboarding flow.",
        "Partnered with product and engineering to improve activation metrics.",
        "Built reusable patterns for complex dashboard workflows.",
      ],
    },
    {
      role: "UX Designer",
      company: "Orbit Studio",
      location: "Barcelona",
      dates: { start: "2019", end: "2022" },
      bullets: [
        "Designed research-backed improvements for SaaS reporting tools.",
        "Facilitated workshops with support, sales, and engineering teams.",
      ],
    },
  ],
  education: [
    {
      institution: "Universidad Complutense de Madrid",
      degree: "BA",
      field: "Design",
      dates: { start: "2015", end: "2019" },
    },
  ],
  skills: [
    { name: "Design", items: ["Product strategy", "UX research", "Systems"] },
    { name: "Tools", items: ["Figma", "FigJam", "Notion"] },
  ],
  technicalSkills: ["Figma", "FigJam", "Notion", "Miro", "Jira", "Abstract"],
  languages: [
    { name: "Spanish", level: "Native" },
    { name: "English", level: "C1" },
  ],
  certifications: [
    { name: "Accessibility Foundations", issuer: "W3C", date: "2024" },
  ],
  projects: [
    {
      name: "Design Ops Toolkit",
      description: "Reusable documentation kit for product teams.",
      bullets: ["Standardized component usage guidance across squads."],
    },
  ],
  awards: [
    { name: "Best UX Innovation", issuer: "Design Awards EU", date: "2023" },
  ],
  volunteering: [
    {
      name: "UX Mentor",
      organization: "ADPList",
      description: "Mentoring junior designers transitioning into product roles.",
    },
  ],
};

const ALL_SECTIONS: Array<keyof StandardCVProfile> = [
  "basics",
  ...CV_RENDERABLE_SECTIONS,
];

export const CV_TEMPLATES: CVTemplateDefinition[] = [
  {
    templateId: "compact",
    name: "Linea",
    description:
      "A single-column resume optimized for fast scanning and keyword visibility.",
    supportedSections: ALL_SECTIONS,
    locales: ["es", "en"],
    fixtureProfile: loremProfile,
  },
  {
    templateId: "classic",
    name: "Marco",
    description:
      "Traditional serif layout with centered header. Ideal for senior roles and formal industries.",
    supportedSections: ALL_SECTIONS,
    locales: ["es", "en"],
    fixtureProfile: loremProfile,
  },
  {
    templateId: "modern",
    name: "Pulso",
    description:
      "Bold contemporary design with strong typographic hierarchy. Great for tech and creative roles.",
    supportedSections: ALL_SECTIONS,
    locales: ["es", "en"],
    fixtureProfile: loremProfile,
  },
  {
    templateId: "filo",
    name: "Filo",
    description:
      "A sharp editorial resume with fearless contrast, built as clean single-column text for ATS parsing.",
    supportedSections: ALL_SECTIONS,
    locales: ["es", "en"],
    fixtureProfile: loremProfile,
  },
];

export function getCVTemplate(templateId: string): CVTemplateDefinition | null {
  return CV_TEMPLATES.find((template) => template.templateId === templateId) ?? null;
}

export function getSectionLabels(locale: string) {
  return SECTION_LABELS[locale as CVTemplateLocale] ?? SECTION_LABELS.es;
}

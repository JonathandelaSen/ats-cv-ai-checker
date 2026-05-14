export {
  createCVLibraryModule,
  type CVLibraryModule,
} from "./cv-library.module";
export {
  CV_PROFILE_SCHEMA_VERSION,
  type StandardCVLink,
  type StandardCVBasics,
  type StandardCVDateRange,
  type StandardCVExperience,
  type StandardCVEducation,
  type StandardCVSkillGroup,
  type StandardCVLanguage,
  type StandardCVNamedItem,
  type StandardCVPresentation,
  type StandardCVProfile,
  normalizeStandardCVProfile,
  getBestCVText,
  profileToPlainText,
  getCVSourceTextHash,
} from "./domain/cv-profile";
export {
  type CVTemplateId,
  type CVTemplateLocale,
  type CVRenderableSectionId,
  type CVPresentationInput,
  type CVTemplateDefinition,
  CV_RENDERABLE_SECTIONS,
  DEFAULT_SECTION_ORDER,
  SECTION_LABELS,
  isRenderableSectionId,
  normalizeSectionOrder,
  normalizeSectionTitles,
  normalizeAccentColor,
  getTemplateAccentColor,
  getResolvedAccentColor,
  getOrderedRenderableSections,
  getSectionTitle,
  CV_TEMPLATES,
  getCVTemplate,
  getSectionLabels,
} from "./domain/cv-templates";
export { CV_PDFS_BUCKET } from "./domain/services/cv-storage";
export {
  presentCVDocument,
  presentCVDocumentSummary,
  presentCVDocuments,
  presentCVStructuredProfile,
  type CVDocumentResponse,
  type CVDocumentSummaryResponse,
  type CVStructuredProfileResponse,
} from "./application/presenters/cv-library-presenters";
export type {
  PrepareCVAnalysisInputInput,
  PrepareCVAnalysisInputResult,
} from "./application/use-cases/prepare-cv-analysis-input.use-case";
export type { DeleteCVDocumentResult } from "./application/use-cases/delete-cv-document.use-case";
export {
  PUBLIC_CV_SLUG_MAX_LENGTH,
  PUBLIC_CV_ID_LENGTH,
  type PublicCVSettingsRequest,
  normalizePublicCVSlug,
  buildPublicCVPath,
  generatePublicCVId,
} from "./domain/services/public-cv";

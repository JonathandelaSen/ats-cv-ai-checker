import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("CV templates expose shared presentation helpers for section customization", () => {
  const source = read("src/lib/cv-templates.ts");

  assert.match(source, /export const CV_RENDERABLE_SECTIONS/);
  assert.match(source, /export const DEFAULT_SECTION_ORDER/);
  assert.match(source, /export function normalizeSectionOrder/);
  assert.match(source, /export function getSectionTitle/);
  assert.match(source, /export function normalizeAccentColor/);
  assert.match(source, /export function getTemplateAccentColor/);
});

test("presentation helpers support custom titles, clean order, and color fallback", () => {
  const source = read("src/lib/cv-templates.ts");

  assert.match(source, /presentation\?:\s*\{\s*sectionTitles\?/s);
  assert.match(source, /customTitle/);
  assert.match(source, /DEFAULT_SECTION_ORDER\.filter/);
  assert.match(source, /\^\#\[0-9a-fA-F\]\{6\}/);
  assert.match(source, /getTemplateAccentColor\(templateId\)/);
});

test("standard profile normalization preserves sanitized presentation metadata", () => {
  const source = read("src/lib/cv-profile.ts");

  assert.match(source, /export interface StandardCVPresentation/);
  assert.match(source, /presentation\?: StandardCVPresentation/);
  assert.match(source, /function normalizePresentation/);
  assert.match(source, /sectionTitles: normalizeSectionTitles/);
  assert.match(source, /sectionOrder:[\s\S]*normalizeSectionOrder\(raw\.sectionOrder\)/);
  assert.match(source, /accentColor: normalizeAccentColor/);
});

test("PDF and preview renderers use shared section ordering and titles", () => {
  const pdfSource = read("src/lib/cv-template-pdf.tsx");
  const previewSource = read("src/components/cv-template-preview.tsx");

  for (const source of [pdfSource, previewSource]) {
    assert.match(source, /getOrderedRenderableSections/);
    assert.match(source, /getSectionTitle/);
    assert.match(source, /getResolvedAccentColor/);
  }
});

test("Pulso PDF headline avoids character spacing that breaks pdfminer extraction", () => {
  const source = read("src/lib/cv-template-pdf.tsx");
  const modernStyles = source.match(
    /const modernStyles = StyleSheet\.create\(\{([\s\S]*?)\n\}\);/
  )?.[1];
  assert.ok(modernStyles);

  const headlineStyle = modernStyles.match(/headline:\s*\{([\s\S]*?)\n  \},/)?.[1];
  assert.ok(headlineStyle);
  assert.match(headlineStyle, /letterSpacing:\s*0/);
});

test("PDF preview keeps the previous document mounted while a refreshed URL loads", () => {
  const source = read("src/components/pdf-preview.tsx");

  assert.match(source, /const \[urls, setUrls\]/);
  assert.match(source, /setTimeout/);
  assert.match(source, /prev\.slice\(-1\)/);
  assert.match(source, /opacity: isOld \? 0\.4 : 1/);
  assert.match(source, /filter: isOld \? "grayscale\(100%\) blur\(2px\)" : "none"/);
  assert.doesNotMatch(source, /\{\[url\]\.map/);
});

test("manual presentation controls support drag and drop section reordering", () => {
  const source = read("src/components/cv-manual-editor/manual-editor.tsx");

  assert.match(source, /draggable/);
  assert.match(source, /onDragStart/);
  assert.match(source, /onDragOver/);
  assert.match(source, /onDrop/);
  assert.match(source, /moveSectionToIndex/);
});

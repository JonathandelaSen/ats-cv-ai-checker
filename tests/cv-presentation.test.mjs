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

test("web preview technical skill tags mirror PDF template chip styles", () => {
  const css = read("src/app/globals.css");

  assert.match(css, /\.cvp-compact \.cvp-tags span\s*\{[\s\S]*background:\s*#f4f4f5/);
  assert.match(css, /\.cvp-classic \.cvp-tags span\s*\{[\s\S]*background:\s*#f0ede6/);
  assert.match(css, /\.cvp-modern \.cvp-tags span\s*\{[\s\S]*background:\s*#f0fdfa/);
  assert.match(css, /\.cvp-filo \.cvp-tags span\s*\{[\s\S]*border:\s*1px solid #9f1239/);
  assert.match(css, /\.cvp-tags span\s*\{[\s\S]*border:\s*0/);
  assert.doesNotMatch(css, /color-mix\(in srgb, var\(--cvp-accent\) 28%, #ded8ce\)/);
});

test("web preview section typography and spacing match PDF template proportions", () => {
  const css = read("src/app/globals.css");
  const cssBlock = (selector) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1];
    assert.ok(block, `Missing ${selector}`);
    return block;
  };

  assert.match(cssBlock(".cvp-section"), /margin-bottom:\s*26px/);
  assert.match(cssBlock(".cvp-section h2"), /font-size:\s*15px/);
  assert.match(cssBlock(".cvp-section h2"), /margin-bottom:\s*13px/);

  assert.match(cssBlock(".cvp-classic .cvp-section"), /margin-bottom:\s*24px/);
  assert.match(cssBlock(".cvp-classic .cvp-section h2"), /font-size:\s*15px/);
  assert.match(cssBlock(".cvp-classic .cvp-section h2"), /margin-bottom:\s*13px/);

  assert.match(cssBlock(".cvp-modern .cvp-section"), /margin-bottom:\s*30px/);
  assert.match(cssBlock(".cvp-modern .cvp-section h2"), /font-size:\s*15px/);
  assert.match(cssBlock(".cvp-modern .cvp-section h2"), /margin-bottom:\s*13px/);

  assert.match(cssBlock(".cvp-filo .cvp-section"), /margin-bottom:\s*22px/);
  assert.match(cssBlock(".cvp-filo .cvp-section h2"), /font-size:\s*13px/);
  assert.match(cssBlock(".cvp-filo .cvp-section h2"), /margin-bottom:\s*12px/);

  assert.match(cssBlock(".cvp-item-head"), /margin-bottom:\s*4px/);
  assert.match(cssBlock(".cvp-item h3,\n.cvp-skills h3"), /line-height:\s*1\.2/);
  assert.match(cssBlock(".cvp-item h3,\n.cvp-skills h3"), /margin-bottom:\s*4px/);
  assert.match(cssBlock(".cvp-tags"), /margin-top:\s*8px/);

  assert.match(cssBlock(".cvp-modern .cvp-item"), /margin-bottom:\s*19px/);
  assert.match(cssBlock(".cvp-modern .cvp-item h3,\n.cvp-modern .cvp-skills h3"), /margin-bottom:\s*3px/);
  assert.match(cssBlock(".cvp-modern .cvp-skills"), /gap:\s*9px/);
  assert.match(cssBlock(".cvp-modern .cvp-tags"), /margin-top:\s*6px/);

  assert.match(cssBlock(".cvp-classic .cvp-skills"), /gap:\s*0/);
  assert.match(cssBlock(".cvp-filo .cvp-skills"), /gap:\s*0/);
});

test("Pulso web preview renders the headline as a header subtitle", () => {
  const source = read("src/components/cv-template-preview.tsx");
  const css = read("src/app/globals.css");

  assert.match(source, /\{basics\.headline && <p className="cvp-headline">\{basics\.headline\}<\/p>\}/);
  assert.doesNotMatch(source, /basics\.headline && !isModern/);
  assert.doesNotMatch(source, /\$\{basics\.headline\}\. \$\{profile\.summary\}/);
  assert.match(source, /const isModern = templateId === "modern"/);
  assert.match(css, /\.cvp-modern \.cvp-headline\s*\{[\s\S]*color:\s*var\(--cvp-accent\)/);
  assert.match(css, /\.cvp-modern \.cvp-headline\s*\{[\s\S]*text-transform:\s*uppercase/);
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

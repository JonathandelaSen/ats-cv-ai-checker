import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

const migrationSources = readdirSync(new URL("supabase/migrations", root))
  .filter((filename) => filename.endsWith(".sql"))
  .sort()
  .map((filename) => read(`supabase/migrations/${filename}`))
  .join("\n");

test("public CV migration stores stable public ids and editable slugs", () => {
  assert.match(migrationSources, /public_enabled boolean not null default false/);
  assert.match(migrationSources, /public_id text/);
  assert.match(migrationSources, /public_slug text/);
  assert.match(migrationSources, /public_published_at timestamptz/);
  assert.match(migrationSources, /unique\s*\(\s*public_id\s*\)/i);
  assert.match(migrationSources, /cvs_public_lookup_idx/i);
});

test("public CV helper normalizes slugs and builds canonical paths", () => {
  assert.ok(exists("src/lib/public-cv.ts"));
  const source = read("src/lib/public-cv.ts");

  assert.match(source, /PUBLIC_CV_SLUG_MAX_LENGTH/);
  assert.match(source, /normalize\("NFD"\)/);
  assert.match(source, /replace\(\s*\/\[\\u0300-\\u036f\]\+\/g/);
  assert.match(source, /export function normalizePublicCVSlug/);
  assert.match(source, /export function buildPublicCVPath/);
  assert.match(source, /confirmPublicExposure/);
});

test("CV API supports guarded public publishing for template CVs only", () => {
  const route = read("src/app/api/cvs/[id]/route.ts");
  const db = read("src/lib/db.ts");

  assert.match(route, /public_enabled/);
  assert.match(route, /confirmPublicExposure/);
  assert.match(route, /normalizePublicCVSlug/);
  assert.match(route, /updateCVPublicSettings/);
  assert.match(db, /public_enabled: boolean/);
  assert.match(db, /public_id: string \| null/);
  assert.match(db, /export async function updateCVPublicSettings/);
  assert.match(db, /\.eq\("type", "template"\)/);
});

test("published CV slugs can be updated without re-running the first publish warning", () => {
  const route = read("src/app/api/cvs/[id]/route.ts");

  assert.match(route, /body\.public_enabled === true\s*&&\s*!existing\.public_enabled/s);
  assert.match(route, /body\.public_slug \?\? existing\.public_slug \?\? existing\.name/);
});

test("public CV page renders a clean responsive platform-owned CV page with PDF download", () => {
  assert.ok(exists("src/app/cv/[publicId]/[slug]/page.tsx"));
  const page = read("src/app/cv/[publicId]/[slug]/page.tsx");
  const css = read("src/app/globals.css");

  assert.match(page, /getPublishedCVByPublicId/);
  assert.match(page, /CVTemplatePreview/);
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/s);
  assert.match(page, /if \(slug !== cv\.public_slug\) \{\s*notFound\(\);/s);
  assert.doesNotMatch(page, /redirect\(/);
  assert.match(page, /Download/);
  assert.match(page, /\/pdf/);
  assert.doesNotMatch(page, />\s*CV público\s*</);
  assert.doesNotMatch(page, /cv\.profile\.basics\?\.name \?\? cv\.name/);
  assert.doesNotMatch(page, /template-pdf/);
  assert.match(css, /\.public-cv-page/);
  assert.match(css, /@media \(max-width: 860px\)/);
  assert.match(css, /--public-cv-scale/);
});

test("public CV PDF route exports only published template CVs", () => {
  assert.ok(exists("src/app/cv/[publicId]/[slug]/pdf/route.ts"));
  const route = read("src/app/cv/[publicId]/[slug]/pdf/route.ts");

  assert.match(route, /getPublishedCVByPublicId/);
  assert.match(route, /renderTemplatePDF/);
  assert.match(route, /Content-Disposition/);
  assert.match(route, /attachment/);
  assert.match(route, /if \(slug !== cv\.public_slug\) \{\s*return NextResponse\.json\(\{ error: "CV not found" \}, \{ status: 404 \}\);/s);
  assert.doesNotMatch(route, /NextResponse\.redirect/);
});

test("CV editor exposes a strong public sharing warning and share URL controls", () => {
  const editor = read("src/components/cv-editor-view.tsx");

  assert.match(editor, /Página pública/);
  assert.match(editor, /Cualquiera con este enlace/);
  assert.doesNotMatch(editor, /No lo publicaremos como PDF descargable/);
  assert.match(editor, /updatePublicSettings\(true,\s*true\)/);
  assert.match(editor, /Guardar URL/);
  assert.match(editor, /hasPublicSlugChanges/);
  assert.match(editor, /public_slug/);
  assert.match(editor, /navigator\.clipboard\.writeText/);
});

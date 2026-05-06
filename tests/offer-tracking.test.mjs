import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migrationSource = read(
  "supabase/migrations/20260506201519_add_offer_tracking_to_analyses.sql"
);
const analysisRouteSource = read("src/app/api/analyses/[id]/route.ts");
const dbSource = read("src/lib/db.ts");
const analysisViewSource = read("src/components/ai-analysis-view.tsx");
const sidebarSource = read("src/components/sidebar.tsx");

test("offer tracking migration adds constrained analysis fields", () => {
  assert.match(migrationSource, /add column if not exists offer_status text/);
  assert.match(migrationSource, /add column if not exists offer_notes text/);
  assert.match(migrationSource, /add column if not exists offer_next_action text/);
  assert.match(
    migrationSource,
    /add column if not exists offer_next_action_at timestamptz/
  );
  assert.match(migrationSource, /analyses_offer_status_check/);
  for (const status of [
    "interesante",
    "aplicado",
    "entrevista",
    "oferta",
    "rechazado",
    "descartado",
  ]) {
    assert.match(migrationSource, new RegExp(`'${status}'`));
  }
  assert.match(migrationSource, /where analysis_mode = 'job_match'/);
});

test("analysis patch route validates and limits offer tracking updates", () => {
  assert.match(analysisRouteSource, /OFFER_STATUSES/);
  assert.match(analysisRouteSource, /Invalid offer status/);
  assert.match(analysisRouteSource, /normalizeOptionalText/);
  assert.match(analysisRouteSource, /normalizeOptionalDate/);
  assert.match(analysisRouteSource, /existing\.analysis_mode !== "job_match"/);
  assert.match(analysisRouteSource, /Offer tracking is only available/);
});

test("offer tracking fields flow through DB summaries and UI", () => {
  assert.match(dbSource, /export type OfferStatus/);
  assert.match(dbSource, /offer_status: OfferStatus \| null/);
  assert.match(
    dbSource,
    /job_url, offer_status, offer_next_action_at/
  );
  assert.match(analysisViewSource, /Seguimiento de oferta/);
  assert.match(analysisViewSource, /offer_next_action_at/);
  assert.match(sidebarSource, /OFFER_STATUS_BADGE_CLASS/);
  assert.match(sidebarSource, /OFFER_STATUS_LABELS\[a\.offer_status\]/);
});

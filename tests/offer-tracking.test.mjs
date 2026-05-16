import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migrationSource = read(
  "supabase/migrations/20260506201519_add_offer_tracking_to_analyses.sql"
);
const analysisRouteSource = read("src/app/api/job-match-analyses/[id]/route.ts");
const validationSource = read("src/app/api/job-match-analyses/validation.ts");
const analysisTypesSource = read("src/lib/analysis-types.ts");
const analysisViewSource = read("src/components/ai-analysis-view.tsx");
const jobAnalysesListSource = read("src/components/job-analyses-list-view.tsx");

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
  assert.match(validationSource, /OFFER_STATUSES/);
  assert.match(validationSource, /Invalid offer status/);
  assert.match(validationSource, /optionalText/);
  assert.match(validationSource, /optionalDate/);
  assert.match(analysisRouteSource, /updateFollowUpByAnalysis/);
  assert.match(analysisRouteSource, /includesOfferTracking/);
});

test("offer tracking fields flow through DB summaries and UI", () => {
  assert.match(analysisTypesSource, /export type OfferStatus/);
  assert.match(analysisTypesSource, /offer_status: OfferStatus \| null/);
  assert.match(analysisTypesSource, /job_url: string \| null/);
  assert.match(analysisTypesSource, /offer_next_action_at: string \| null/);
  assert.match(analysisViewSource, /Seguimiento de oferta/);
  assert.match(analysisViewSource, /offer_next_action_at/);
  assert.match(jobAnalysesListSource, /OFFER_STATUS_BADGE_CLASS/);
  assert.match(jobAnalysesListSource, /OFFER_STATUS_LABELS\[a\.offer_status\]/);
});

import { suggestActivityContextsFromCVs } from "./suggest-activity-contexts.service";
import { describe, expect, it } from "vitest";

describe("suggestActivityContextsFromCVs", () => {
  it("suggests employers and projects from template CVs", () => {
    const suggestions = suggestActivityContextsFromCVs([
      {
        type: "template",
        profile: {
          personalInfo: {},
          experience: [
            { company: "Acme", role: "Lead", dates: { start: "", end: "", current: true }, bullets: [] },
          ],
          education: [],
          skills: [],
          languages: [],
          projects: [{ name: "Apollo", organization: "Acme Lab", bullets: [] }],
          certifications: [],
          publications: [],
          volunteering: [],
        },
      },
    ]);

    expect(suggestions.map((suggestion) => suggestion.toPrimitives())).toEqual([
      {
        type: "employment",
        name: "Acme",
        roleOrLabel: "Lead",
        isCurrent: true,
        source: "cv",
      },
      {
        type: "project",
        name: "Apollo",
        roleOrLabel: "Acme Lab",
        isCurrent: false,
        source: "cv",
      },
    ]);
  });
});

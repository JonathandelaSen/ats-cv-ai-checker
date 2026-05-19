import { ActivityContext } from "../../domain/entities/activity-context.entity";
import { ListActivityContextSuggestionsUseCase } from "./list-activity-context-suggestions.use-case";
import { describe, expect, it, vi } from "vitest";

describe("ListActivityContextSuggestionsUseCase", () => {
  it("excludes existing and hidden CV suggestions", async () => {
    const repo = {
      search: vi.fn().mockResolvedValue([
        ActivityContext.fromPrimitives({
          id: "context-1",
          userId: "user-1",
          type: "employment",
          name: "Existing Company",
          status: "active",
          isDefault: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      ]),
      listHiddenSuggestionKeys: vi.fn().mockResolvedValue(new Set(["project:hidden project"])),
    };
    const cvDataRepo = {
      listCVs: vi.fn().mockResolvedValue([
        {
          type: "template",
          profile: {
            personalInfo: {},
            experience: [
              { company: "Existing Company", role: "Engineer", bullets: [] },
              { company: "Suggested Company", role: "Staff", bullets: [] },
            ],
            education: [],
            skills: [],
            languages: [],
            projects: [
              { name: "Hidden Project", organization: "Lab", bullets: [] },
              { name: "Visible Project", organization: "Lab", bullets: [] },
            ],
            certifications: [],
            publications: [],
            volunteering: [],
          },
        },
      ]),
    };

    const result = await new ListActivityContextSuggestionsUseCase({
      activityContextRepo: repo as never,
      cvDataRepo,
    }).execute("user-1");

    expect(result.map((suggestion) => suggestion.toPrimitives())).toEqual([
      {
        type: "employment",
        name: "Suggested Company",
        roleOrLabel: "Staff",
        isCurrent: false,
        source: "cv",
      },
      {
        type: "project",
        name: "Visible Project",
        roleOrLabel: "Lab",
        isCurrent: false,
        source: "cv",
      },
    ]);
  });
});

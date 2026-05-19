import { faker } from "@faker-js/faker";
import type { CreateActivityContextInput } from "../application/use-cases/create-activity-context.use-case";

const TYPES = ["employment", "project", "personal", "other"] as const;

export class ActivityContextFixture {
  static createInput(
    overrides: Partial<CreateActivityContextInput> = {},
  ): CreateActivityContextInput {
    return {
      userId: overrides.userId ?? faker.string.uuid(),
      type: faker.helpers.arrayElement(TYPES),
      name: faker.helpers.arrayElement([
        `${faker.company.name()} - ${faker.person.jobTitle()}`,
        `Proyecto ${faker.commerce.productName()}`,
        `Freelance ${faker.company.buzzNoun()}`,
        faker.company.catchPhrase(),
      ]),
      ...overrides,
    };
  }
}

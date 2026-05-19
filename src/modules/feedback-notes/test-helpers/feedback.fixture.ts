import { faker } from "@faker-js/faker";
import type { CreateFeedbackInput } from "../application/use-cases/create-feedback.use-case";
import type { CreateEntryInput } from "../application/use-cases/create-entry.use-case";

export class FeedbackFixture {
  static createInput(
    overrides: Partial<CreateFeedbackInput> = {},
  ): CreateFeedbackInput {
    return {
      user_id: overrides.user_id ?? faker.string.uuid(),
      person_name: `${faker.person.fullName()} (${faker.person.jobTitle()})`,
      ...overrides,
    };
  }

  static createEntryInput(
    overrides: Partial<CreateEntryInput> = {},
  ): CreateEntryInput {
    return {
      user_id: overrides.user_id ?? faker.string.uuid(),
      feedback_id: overrides.feedback_id ?? faker.string.uuid(),
      content: faker.helpers.arrayElement([
        `${faker.person.firstName()} mencionó que ${faker.company.catchPhrase().toLowerCase()} fue un logro clave esta semana.`,
        `Feedback positivo: excelente trabajo en ${faker.commerce.productName()}, especialmente la ${faker.company.buzzNoun()}.`,
        `Sugerencia: mejorar la documentación de ${faker.hacker.noun()} para facilitar el onboarding de nuevos miembros.`,
        `Destacó la proactividad al resolver el incidente de ${faker.hacker.noun()} en producción sin ayuda.`,
        `Reconoció el esfuerzo extra en la entrega del sprint de ${faker.commerce.department()}.`,
      ]),
      ...overrides,
    };
  }
}

import { faker } from "@faker-js/faker";
import type { CreateEntryInput } from "../application/use-cases/create-entry.use-case";

const INPUT_MODES = ["manual", "ai_assisted"] as const;

export class WorkJournalEntryFixture {
  static createInput(
    overrides: Partial<CreateEntryInput> = {},
  ): CreateEntryInput {
    const daysAgo = faker.number.int({ min: 0, max: 90 });
    const dateStart = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const inputMode = faker.helpers.arrayElement(INPUT_MODES);

    const topic = faker.helpers.arrayElement([
      `Refactorización de ${faker.hacker.noun()}`,
      `Diseño de API para ${faker.commerce.productName()}`,
      `Resolución de bug en ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
      `Reunión de planificación: ${faker.company.catchPhrase()}`,
      `Code review de ${faker.person.firstName()}`,
      `Investigación: ${faker.hacker.phrase()}`,
      `Deploy de ${faker.commerce.productName()} v${faker.system.semver()}`,
      `Pair programming con ${faker.person.firstName()}`,
      `Optimización de rendimiento en ${faker.hacker.noun()}`,
      `Documentación de ${faker.hacker.noun()}`,
    ]);

    const rawNotes = faker.helpers.arrayElement([
      `Trabajé en ${topic.toLowerCase()}. ${faker.company.catchPhrase()}.`,
      `Sesión productiva de ${faker.number.int({ min: 2, max: 6 })} horas dedicadas a ${topic.toLowerCase()}.`,
      `Avancé significativamente en ${topic.toLowerCase()}. Pendiente: ${faker.hacker.phrase()}.`,
    ]);

    return {
      user_id: overrides.user_id ?? faker.string.uuid(),
      context_id: overrides.context_id ?? faker.string.uuid(),
      date_start: dateStart.toISOString().split("T")[0],
      date_end: null,
      topic,
      input_mode: inputMode,
      raw_notes: rawNotes,
      final_text:
        inputMode === "ai_assisted"
          ? `${rawNotes}\n\nResumen expandido: ${faker.lorem.paragraph()}`
          : rawNotes,
      ...overrides,
    };
  }
}

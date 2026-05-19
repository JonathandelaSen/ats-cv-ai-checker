import { faker } from "@faker-js/faker";
import type { CreateCommitmentInput } from "../application/use-cases/create-commitment.use-case";
import type { CreateCommitmentItemInput } from "../application/use-cases/create-item.use-case";
import type { CreateCommitmentOutcomeInput } from "../application/use-cases/create-outcome.use-case";

const SOURCES = ["manager", "self", "company", "project", "other"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;
const ITEM_STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;
const OUTCOME_TYPES = [
  "promotion",
  "role_change",
  "leadership",
  "mentoring",
  "money",
  "recognition",
  "learning",
  "other",
] as const;
const OUTCOME_STATUSES = ["expected", "achieved", "missed", "changed"] as const;

export class CommitmentFixture {
  static createCommitmentInput(
    overrides: Partial<CreateCommitmentInput> = {},
  ): CreateCommitmentInput {
    const startDaysAgo = faker.number.int({ min: 5, max: 60 });
    const targetDaysFromNow = faker.number.int({ min: 15, max: 120 });

    return {
      userId: overrides.userId ?? faker.string.uuid(),
      contextId: overrides.contextId ?? faker.string.uuid(),
      title: faker.helpers.arrayElement([
        `Completar migración de ${faker.hacker.noun()} a ${faker.hacker.adjective()} arquitectura`,
        `Mejorar cobertura de tests al ${faker.number.int({ min: 70, max: 95 })}%`,
        `Liderar el rediseño de ${faker.commerce.productName()}`,
        `Obtener certificación ${faker.helpers.arrayElement(["AWS", "GCP", "Azure", "Kubernetes", "Terraform"])}`,
        `Reducir tiempo de deploy en un ${faker.number.int({ min: 20, max: 60 })}%`,
        `Implementar observabilidad en ${faker.hacker.noun()}`,
      ]),
      description: faker.lorem.paragraph(),
      successCriteria: faker.lorem.sentences(2),
      source: faker.helpers.arrayElement(SOURCES),
      priority: faker.helpers.arrayElement(PRIORITIES),
      startDate: new Date(Date.now() - startDaysAgo * 86400000)
        .toISOString()
        .split("T")[0],
      targetDate: new Date(Date.now() + targetDaysFromNow * 86400000)
        .toISOString()
        .split("T")[0],
      ...overrides,
    };
  }

  static createItemInput(
    overrides: Partial<CreateCommitmentItemInput> = {},
  ): CreateCommitmentItemInput {
    return {
      userId: overrides.userId ?? faker.string.uuid(),
      commitmentId: overrides.commitmentId ?? faker.string.uuid(),
      title: faker.helpers.arrayElement([
        `Escribir documentación de ${faker.hacker.noun()}`,
        `Implementar tests para ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
        `Revisar PR de ${faker.person.firstName()}`,
        `Configurar pipeline de ${faker.hacker.verb()}`,
        `Reunión de alineamiento con ${faker.person.jobTitle()}`,
        `Spike técnico: ${faker.hacker.phrase()}`,
      ]),
      notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      status: faker.helpers.arrayElement(ITEM_STATUSES),
      dueDate: faker.datatype.boolean()
        ? new Date(
            Date.now() +
              faker.number.int({ min: -10, max: 30 }) * 86400000,
          )
            .toISOString()
            .split("T")[0]
        : null,
      orderIndex: overrides.orderIndex ?? 0,
      ...overrides,
    };
  }

  static createOutcomeInput(
    overrides: Partial<CreateCommitmentOutcomeInput> = {},
  ): CreateCommitmentOutcomeInput {
    const type = faker.helpers.arrayElement(OUTCOME_TYPES);
    return {
      userId: overrides.userId ?? faker.string.uuid(),
      commitmentId: overrides.commitmentId ?? faker.string.uuid(),
      type,
      status: faker.helpers.arrayElement(OUTCOME_STATUSES),
      title: faker.helpers.arrayElement([
        "Promoción a Tech Lead",
        "Reconocimiento como referente técnico del equipo",
        `Dominio avanzado de ${faker.helpers.arrayElement(["Kubernetes", "DDD", "Event Sourcing", "GraphQL"])}`,
        "Bonus por cumplimiento de objetivos",
        `Mejora medible en ${faker.helpers.arrayElement(["latencia", "disponibilidad", "cobertura de tests", "throughput"])}`,
      ]),
      description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      amount:
        type === "money"
          ? faker.number.int({ min: 500, max: 10000 })
          : null,
      currency: type === "money" ? "EUR" : null,
      ...overrides,
    };
  }
}

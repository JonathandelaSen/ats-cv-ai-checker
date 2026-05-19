import { faker } from "@faker-js/faker";
import type { CreateReceivedFeedbackInput } from "../application/use-cases/create-received-feedback.use-case";

export class ReceivedFeedbackFixture {
  static createInput(
    overrides: Partial<CreateReceivedFeedbackInput> = {},
  ): CreateReceivedFeedbackInput {
    const daysAgo = faker.number.int({ min: 1, max: 60 });
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    return {
      userId: overrides.userId ?? faker.string.uuid(),
      activityContextId: overrides.activityContextId ?? faker.string.uuid(),
      receivedDate: date.toISOString().split("T")[0],
      giverName: `${faker.person.fullName()} (${faker.person.jobTitle()})`,
      feedbackText: faker.helpers.arrayElement([
        `Excelente trabajo liderando la iniciativa de ${faker.commerce.productName()}. Tu capacidad de comunicación técnica con stakeholders no técnicos es sobresaliente.`,
        `Tu contribución al diseño de la arquitectura de ${faker.hacker.noun()} ha elevado significativamente la calidad del código del equipo.`,
        `Buen trabajo coordinando el lanzamiento. Sugerencia: involucrar al equipo de QA más temprano en el proceso de desarrollo para detectar edge cases.`,
        `Se nota una mejora considerable en tu gestión del tiempo. Los entregables de las últimas dos semanas llegaron antes del deadline.`,
      ]),
      userNote: faker.datatype.boolean()
        ? faker.helpers.arrayElement([
            "Tomar nota de esto para la próxima retrospectiva.",
            "Agradezco el reconocimiento. Seguir en esta línea.",
            "Punto interesante, incorporar esta sugerencia en el próximo sprint.",
          ])
        : null,
      ...overrides,
    };
  }
}

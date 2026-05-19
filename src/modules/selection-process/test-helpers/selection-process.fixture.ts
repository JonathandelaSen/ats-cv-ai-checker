import { faker } from "@faker-js/faker";
import crypto from "node:crypto";
import type { CreateProcessQuestionInput } from "../application/use-cases/create-process-question.use-case";

export class SelectionProcessFixture {
  static createProcessQuestionInput(
    overrides: Partial<CreateProcessQuestionInput> = {},
  ): CreateProcessQuestionInput {
    return {
      userId: overrides.userId ?? faker.string.uuid(),
      jobOpportunityId: overrides.jobOpportunityId ?? null,
      question: faker.helpers.arrayElement([
        "¿Cómo manejarías la migración de un monolito a microservicios sin downtime?",
        "Describe tu experiencia liderando equipos técnicos distribuidos.",
        "¿Qué estrategia usarías para optimizar queries lentas en PostgreSQL?",
        "¿Cómo implementarías un sistema de caché distribuido?",
        "Explica cómo diseñarías una API que soporte 100k requests/segundo.",
        "¿Cuál es tu enfoque para testing en aplicaciones con múltiples integraciones externas?",
        "¿Cómo manejas conflictos técnicos dentro de un equipo de desarrollo?",
        "Describe un sistema que hayas diseñado de principio a fin.",
        "¿Qué patrones de diseño aplicas habitualmente y por qué?",
        "¿Cómo garantizas la seguridad en una aplicación web moderna?",
      ]),
      context: faker.datatype.boolean()
        ? `Pregunta para la posición de ${faker.person.jobTitle()} en ${faker.company.name()}.`
        : null,
      answer: faker.datatype.boolean()
        ? faker.lorem.paragraphs(2)
        : null,
      requestId: crypto.randomUUID(),
      ...overrides,
    };
  }

  static createJobOpportunityRow(userId: string) {
    const company = faker.company.name();
    const title = faker.person.jobTitle();
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      company,
      title,
      location: `${faker.location.city()}, ${faker.location.country()}`,
      remote: faker.helpers.arrayElement([
        "Remote",
        "Hybrid",
        "On-site",
      ]),
      salary: `${faker.number.int({ min: 40, max: 120 })}k - ${faker.number.int({ min: 120, max: 200 })}k EUR`,
      seniority: faker.helpers.arrayElement([
        "Junior",
        "Mid",
        "Senior",
        "Lead",
        "Staff",
        "Principal",
      ]),
      contract_type: faker.helpers.arrayElement([
        "Full-time",
        "Part-time",
        "Contract",
        "Freelance",
      ]),
      url: faker.internet.url(),
      benefits: faker.helpers.arrayElements(
        [
          "Seguro médico",
          "Teletrabajo",
          "Formación continua",
          "Stock options",
          "Bonus anual",
          "Gimnasio",
          "Comida en oficina",
          "Horario flexible",
        ],
        { min: 2, max: 5 },
      ),
      requirements: faker.helpers.arrayElements(
        [
          "5+ años de experiencia",
          "TypeScript/JavaScript avanzado",
          "Experiencia con React/Next.js",
          "PostgreSQL o bases de datos relacionales",
          "Docker y CI/CD",
          "Experiencia con cloud (AWS/GCP/Azure)",
          "Liderazgo técnico",
          "Metodologías ágiles",
        ],
        { min: 3, max: 6 },
      ),
      responsibilities: faker.helpers.arrayElements(
        [
          "Diseñar y construir funcionalidades core del producto",
          "Mentorizar desarrolladores junior",
          "Participar en revisiones de código",
          "Colaborar con producto y diseño",
          "Mantener y mejorar la infraestructura",
          "Garantizar calidad y rendimiento del código",
        ],
        { min: 2, max: 4 },
      ),
      description: `Buscamos un ${title} apasionado para unirse a ${company}. ${faker.company.catchPhrase()}.`,
    };
  }

  static createFollowUpRow(userId: string, jobOpportunityId: string) {
    const STATUSES = [
      "aplicado",
      "entrevista",
      "oferta",
      "rechazado",
      "descartado",
    ];
    return {
      user_id: userId,
      job_opportunity_id: jobOpportunityId,
      status: faker.helpers.arrayElement(STATUSES),
      notes: faker.lorem.sentence(),
      next_action: faker.datatype.boolean()
        ? faker.helpers.arrayElement([
            "Preparar caso técnico",
            "Enviar email de seguimiento",
            "Revisar oferta económica",
            "Preparar preguntas para el entrevistador",
          ])
        : null,
      next_action_at: faker.datatype.boolean()
        ? new Date(
            Date.now() +
              faker.number.int({ min: 1, max: 14 }) * 86400000,
          ).toISOString()
        : null,
    };
  }
}

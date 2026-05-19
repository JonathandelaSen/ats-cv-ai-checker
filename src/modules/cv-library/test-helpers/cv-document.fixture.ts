import { faker } from "@faker-js/faker";
import crypto from "node:crypto";
import type { CreateUploadedCVDocumentInput } from "../application/use-cases/create-uploaded-cv-document.use-case";

export class CVDocumentFixture {
  static createUploadedInput(
    overrides: Partial<CreateUploadedCVDocumentInput> = {},
  ): CreateUploadedCVDocumentInput {
    const name = faker.person.fullName();
    const filename = `cv_${name.toLowerCase().replace(/\s+/g, "_")}.pdf`;

    return {
      id: crypto.randomUUID(),
      userId: overrides.userId ?? faker.string.uuid(),
      name: `CV ${name}`,
      filename,
      fileSize: faker.number.int({ min: 20000, max: 500000 }),
      pdfStoragePath: null,
      textPython: null,
      textPdfjs: null,
      textNode: CVDocumentFixture.generateMockCVText(name),
      extractErrorPython: null,
      extractErrorPdfjs: null,
      extractErrorNode: null,
      ...overrides,
    };
  }

  static generateMockCVText(name?: string): string {
    const fullName = name ?? faker.person.fullName();
    const title = faker.person.jobTitle();
    const company1 = faker.company.name();
    const company2 = faker.company.name();

    return [
      `${fullName} | ${title}`,
      `Email: ${faker.internet.email({ firstName: fullName.split(" ")[0] })} | Tel: ${faker.phone.number()} | Location: ${faker.location.city()}, ${faker.location.country()}`,
      "",
      "EXPERIENCE:",
      `${company1} - ${faker.person.jobTitle()} (${faker.date.past({ years: 3 }).getFullYear()} - Present)`,
      `- ${faker.company.catchPhrase()}`,
      `- Led team of ${faker.number.int({ min: 3, max: 12 })} developers`,
      `- Improved system performance by ${faker.number.int({ min: 20, max: 80 })}%`,
      "",
      `${company2} - ${faker.person.jobTitle()} (${faker.date.past({ years: 7 }).getFullYear()} - ${faker.date.past({ years: 3 }).getFullYear()})`,
      `- ${faker.company.catchPhrase()}`,
      `- Built ${faker.commerce.productName()} serving ${faker.number.int({ min: 1000, max: 100000 })} users`,
      "",
      "EDUCATION:",
      `${faker.company.name()} University - ${faker.helpers.arrayElement(["BSc", "MSc", "MBA"])} in ${faker.helpers.arrayElement(["Computer Science", "Software Engineering", "Data Science", "Information Systems"])}`,
      "",
      `SKILLS: ${faker.helpers.arrayElements(["TypeScript", "React", "Node.js", "Python", "PostgreSQL", "Docker", "AWS", "Next.js", "GraphQL", "Redis", "Kubernetes", "Go", "Java", "C#", "TailwindCSS"], { min: 5, max: 8 }).join(", ")}`,
    ].join("\n");
  }
}

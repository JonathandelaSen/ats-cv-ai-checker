import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  findMissingDddTests,
  formatMissingDddTests,
} from "../scripts/verify-ddd-tests.mjs";
import {
  findDddImportViolations,
  formatDddImportViolations,
} from "../scripts/verify-ddd-imports.mjs";

async function withFixture(files, fn) {
  const root = await mkdtemp(path.join(tmpdir(), "ddd-guardrails-"));
  try {
    for (const [filePath, contents] of Object.entries(files)) {
      const absolutePath = path.join(root, filePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, contents);
    }
    await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("DDD test coverage check requires tests next to every use case and repository implementation", async () => {
  await withFixture(
    {
      "src/modules/sales/application/use-cases/create-sale.use-case.ts": "export {};",
      "src/modules/sales/application/use-cases/create-sale.use-case.test.ts": "export {};",
      "src/modules/sales/application/use-cases/list-sales.use-case.ts": "export {};",
      "src/modules/sales/infrastructure/repositories/supabase-sales.repository.ts": "export {};",
      "src/modules/shared/infrastructure/repositories/supabase-event-tracker.repository.ts": "export {};",
      "src/modules/sales/infrastructure/repositories/supabase-sales.repository.test.ts": "export {};",
    },
    async (root) => {
      const result = await findMissingDddTests({ rootDir: root });

      assert.deepEqual(
        result.missingUseCaseTests.map((item) => item.expectedTest),
        ["src/modules/sales/application/use-cases/list-sales.use-case.test.ts"]
      );
      assert.deepEqual(
        result.missingRepositoryTests.map((item) => item.expectedTest),
        [
          "src/modules/shared/infrastructure/repositories/supabase-event-tracker.repository.test.ts",
        ]
      );
      assert.match(formatMissingDddTests(result), /list-sales\.use-case\.test\.ts/);
      assert.match(formatMissingDddTests(result), /supabase-event-tracker\.repository\.test\.ts/);
    }
  );
});

test("DDD import check allows inward dependencies and rejects layer leaks", async () => {
  await withFixture(
    {
      "src/modules/sales/domain/repositories/sales.repository.ts": [
        'import type { Sale } from "../entities/sale.entity";',
        'import { CreateSaleUseCase } from "../../application/use-cases/create-sale.use-case";',
      ].join("\n"),
      "src/modules/sales/domain/entities/sale.entity.ts": "export {};",
      "src/modules/sales/application/use-cases/create-sale.use-case.ts": [
        'import type { SalesRepository } from "../../domain/repositories/sales.repository";',
        'import { SupabaseSalesRepository } from "../../infrastructure/repositories/supabase-sales.repository";',
        'import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";',
      ].join("\n"),
      "src/modules/sales/infrastructure/repositories/supabase-sales.repository.ts": [
        'import type { SalesRepository } from "../../domain/repositories/sales.repository";',
        'import { CreateInvoiceUseCase } from "@/modules/billing/application/use-cases/create-invoice.use-case";',
      ].join("\n"),
      "src/modules/sales/sales.module.ts": [
        'import { CreateSaleUseCase } from "./application/use-cases/create-sale.use-case";',
        'import { SupabaseSalesRepository } from "./infrastructure/repositories/supabase-sales.repository";',
      ].join("\n"),
      "src/modules/sales/application/use-cases/create-sale.use-case.test.ts": [
        'import { SupabaseSalesRepository } from "../../infrastructure/repositories/supabase-sales.repository";',
      ].join("\n"),
    },
    async (root) => {
      const violations = await findDddImportViolations({ rootDir: root });

      assert.deepEqual(
        violations.map((violation) => violation.rule).sort(),
        [
          "application-imports-infrastructure",
          "cross-module-internal-import",
          "domain-imports-application",
        ]
      );
      assert.match(formatDddImportViolations(violations), /domain-imports-application/);
      assert.doesNotMatch(formatDddImportViolations(violations), /sales\.module\.ts/);
      assert.doesNotMatch(formatDddImportViolations(violations), /create-sale\.use-case\.test\.ts/);
    }
  );
});

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
import {
  findQueryBusViolations,
  formatQueryBusViolations,
} from "../scripts/verify-query-bus.mjs";
import {
  findSupabaseRepositoryTableViolations,
  formatSupabaseRepositoryTableViolations,
} from "../scripts/verify-ddd-supabase-repository-tables.mjs";

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

test("DDD test coverage check requires query handler and query bus tests", async () => {
  await withFixture(
    {
      "src/modules/sales/application/queries/get-sale.query.ts": "export {};",
      "src/modules/sales/application/queries/get-sale.query-handler.ts": "export {};",
      "src/modules/shared/application/query-bus/in-memory-query-bus.ts": "export {};",
      "src/modules/shared/application/query-bus/query.ts": "export {};",
    },
    async (root) => {
      const result = await findMissingDddTests({ rootDir: root });

      assert.deepEqual(
        result.missingQueryHandlerTests.map((item) => item.expectedTest),
        ["src/modules/sales/application/queries/get-sale.query-handler.test.ts"]
      );
      assert.deepEqual(
        result.missingQueryBusTests.map((item) => item.expectedTest),
        [
          "src/modules/shared/application/query-bus/in-memory-query-bus.test.ts",
          "src/modules/shared/application/query-bus/query.test.ts",
        ]
      );
      assert.match(formatMissingDddTests(result), /get-sale\.query-handler\.test\.ts/);
      assert.match(formatMissingDddTests(result), /in-memory-query-bus\.test\.ts/);
    }
  );
});

test("query bus check enforces query and handler conventions", async () => {
  await withFixture(
    {
      "src/modules/sales/application/queries/get-sale.query.ts": [
        'export class GetSaleQuery {',
        '  static readonly queryName = "sales.get-sale";',
        '  readonly queryName = GetSaleQuery.queryName;',
        '  constructor(public readonly payload: { id: string }) {}',
        "}",
      ].join("\n"),
      "src/modules/sales/application/queries/get-sale.query-handler.ts": [
        'import { GetSaleUseCase } from "../use-cases/get-sale.use-case";',
        'import { GetSaleQuery } from "./get-sale.query";',
        "export class GetSaleQueryHandler {",
        "  constructor(private readonly useCase: GetSaleUseCase) {}",
        "  async handle(query: GetSaleQuery) {",
        "    return this.useCase.execute(query.payload);",
        "  }",
        "}",
      ].join("\n"),
      "src/modules/sales/application/use-cases/get-sale.use-case.ts": "export class GetSaleUseCase {}",
      "src/modules/sales/application/queries/list-sales.query.ts": [
        'export class ListSalesQuery {',
        '  static readonly queryName = "sales.get-sale";',
        '  readonly queryName = ListSalesQuery.queryName;',
        '  constructor(public readonly payload: { id: string }) {}',
        "}",
      ].join("\n"),
      "src/modules/sales/application/queries/bad-sale.query.ts": "export const bad = true;",
      "src/modules/sales/application/queries/bad-sale.query-handler.ts": [
        'import { SupabaseSalesRepository } from "../../infrastructure/repositories/supabase-sales.repository";',
        "export class BadSaleHandler {",
        "  async handle() {",
        '    return SupabaseSalesRepository.from("sales").select("*");',
        "  }",
        "}",
      ].join("\n"),
    },
    async (root) => {
      const violations = await findQueryBusViolations({ rootDir: root });

      assert.deepEqual(
        violations.map((violation) => violation.rule).sort(),
        [
          "duplicate-query-name",
          "query-class-missing",
          "query-handler-banned-db-call",
          "query-handler-imports-infrastructure",
          "query-handler-missing",
          "query-handler-no-use-case",
          "query-handler-wrong-class-name",
        ]
      );
      assert.match(formatQueryBusViolations(violations), /Query bus violations:/);
      assert.match(formatQueryBusViolations(violations), /query-handler-no-use-case/);
    }
  );
});

test("Supabase repository table check rejects tables outside the owning module", async () => {
  await withFixture(
    {
      "src/modules/sales/infrastructure/repositories/supabase-sales.repository.ts": [
        "export class SupabaseSalesRepository {",
        "  async save() {",
        '    await this.client.from("sales").select("*");',
        '    await this.client.from("billing_invoices").select("*");',
        "  }",
        "}",
      ].join("\n"),
      "src/modules/billing/infrastructure/repositories/supabase-billing.repository.ts": [
        "export class SupabaseBillingRepository {",
        "  async save() {",
        '    await this.client.from("billing_invoices").select("*");',
        "  }",
        "}",
      ].join("\n"),
    },
    async (root) => {
      const violations = await findSupabaseRepositoryTableViolations({ rootDir: root });

      assert.deepEqual(violations, [
        {
          file: "src/modules/sales/infrastructure/repositories/supabase-sales.repository.ts",
          moduleName: "sales",
          table: "billing_invoices",
          reason:
            'Supabase repositories may only query tables owned by their module. Move cross-module reads behind a query bus read model owned by "billing".',
        },
      ]);
      assert.match(
        formatSupabaseRepositoryTableViolations(violations),
        /billing_invoices/,
      );
    }
  );
});

# Plan de Implementación: Sistema de Generación de Datos Sintéticos Masivos (Seeder)

Este documento detalla la arquitectura y los pasos para implementar un nuevo sistema de población de base de datos (`seed`) utilizando datos sintéticos generados dinámicamente con `faker.js`. El objetivo es saturar la base de datos de manera realista para probar interfaces de usuario (paginación, scroll infinito, carga de datos pesada) en el entorno de desarrollo y E2E.

**El objetivo central es reemplazar el actual `scripts/seed-agent-data.mjs` (estático) por un nuevo script masivo que utilice `faker` apoyándose en los Casos de Uso del dominio.**

## 1. Patrones Arquitectónicos

### 1.1 Dependencias
- Se utilizará la librería oficial `@faker-js/faker`.
- Debe instalarse **estrictamente como `devDependency`** (`npm i -D @faker-js/faker`).

### 1.2 Generadores de Inputs (Fixtures)
- **No se utilizarán Entity Mothers** (no retornarán entidades de dominio).
- Se crearán **Fixtures** cuya única responsabilidad será generar los **objetos de entrada (Primitivas / DTOs / Inputs)** que esperan los Casos de Uso.
- **Ubicación:** `src/modules/<module-name>/test-helpers/<entity>.fixture.ts`.
- **Nomenclatura:** Clases llamadas `<Entity>Fixture` con métodos como `createInput()`.
- **Uso de Value Objects:** Aunque el Fixture retorne primitivas, debe utilizar internamente los Value Objects correspondientes (ej: `JobOpportunityId.random().value`) para garantizar que la data generada (ej. UUIDs, estados predefinidos) sea válida según las reglas del dominio y no cause fallos en la instanciación posterior por el Caso de Uso.
- *Nota de arquitectura:* Las reglas de chequeo de límites de frontend y DDD (`verify-ddd-imports.mjs`) garantizarán que código en producción no importe de `test-helpers/`.

### 1.3 Módulos E2E / Seeder (Inyección de Infraestructura Falsa)
Dado que usaremos los Casos de Uso reales para insertar los datos en la base de datos, debemos evitar invocar servicios externos de alto coste computacional (como APIs de IA reales o procesadores de PDF python).
- **Mocks de IA:** El ecosistema de la app ya implementa un `Provider*AIServiceFactory`. Para saltarnos las peticiones a Gemini, simplemente pasaremos `{ provider: "mock" }` como parámetro a la función `.execute()` de los casos de uso correspondientes.
- **Mocks de Otros Servicios (ej. Parser de PDF):** Cuando un módulo necesite mockear una pieza de infraestructura en duro (por ejemplo, el `PdfTextExtractor` en `cv-library`), se creará un **nuevo archivo de módulo E2E** (ej: `src/modules/cv-library/cv-library.e2e.module.ts`).
  - Este módulo `.e2e.module.ts` consumirá la misma función interna `createUseCases` pero le inyectará implementaciones Mock (ej: `new MockPdfTextExtractor()`) para las interfaces costosas.
  - **Excepción:** Todo lo relacionado con la Base de Datos y Storage de Supabase usará implementaciones reales. Iremos contra el Supabase E2E.

## 2. Archivos Físicos y Subidas (Storage)

El flujo de creación de CVs exige interactuar con Supabase Storage.
- Se debe proveer una carpeta con PDFs reales o mockeados, por ejemplo en `.test-infra/fixtures/cvs/`.
- El fixture o el script de seed seleccionará al azar uno de estos archivos y llamará a los Casos de Uso que suben físicamente la información al Storage usando los Repositorios reales de Supabase (`SupabaseCVPdfStorage`). No se debe mockear el guardado de archivos.

## 3. Comportamiento del Script de Seed (`scripts/seed-synthetic-data.mjs` u homólogo)

### 3.1 Sesión Autenticada y RLS
Para garantizar que las Row Level Security (RLS) se apliquen estrictamente de la misma forma que en producción:
- El script **no usará el cliente Admin (`service_role`)** para invocar los casos de uso.
- El script instanciará un cliente anónimo y ejecutará explícitamente un inicio de sesión: `supabase.auth.signInWithPassword({ email: 'agent-test@example.com', password: 'agent-test-password' })`.
- El cliente autenticado se inyectará en todos los módulos llamando a `module.bindRequest(supabaseClient)`.

### 3.2 Volumen de Datos
El volumen debe ser masivo pero concentrado en un único usuario de pruebas. Ejemplos de distribución sugeridos:
- 1 Usuario de prueba (`agent-test@example.com`).
- ~5 a 10 Contextos de Actividad.
- ~5 Currículums (CVs) (múltiples uploads) -> perfiles estructurados -> múltiples análisis CV.
- ~30 a 50 Ofertas de trabajo (`JobOpportunities`) -> emparejamientos (`JobMatchAnalyses`) -> seguimientos (`FollowUps`) y preguntas (`ProcessQuestions`).
- ~50+ Notas de Feedback agrupadas en diferentes personas.
- ~100 Entradas del Diario de Trabajo vinculadas a distintos contextos.
- Varios `Commitments` y sus `Items`.

### 3.3 Orden de Ejecución Estricto (Restricciones de Integridad)
El flujo debe respetar las claves foráneas (Foreign Keys) de la base de datos:
1. Asegurar el Usuario de Prueba (crearlo si no existe mediante Admin Client crudo, luego hacer Login).
2. Crear/Limpiar Datos Antiguos (Raw Delete queries como se hacía en el seed anterior, por seguridad, o simplemente regenerar el entorno Supabase E2E limpio).
3. Insertar `ActivityContexts`.
4. Ejecutar creación masiva de `CVs` (usando el módulo e2e para aislar el PDF parser) -> Y sus cascadas (Perfiles Estructurados y Análisis de CV con proveedor `mock`).
5. Ejecutar creación masiva de `JobOpportunities` -> Y sus cascadas (Job Match Analyses con proveedor `mock`, Follow Ups, Process Questions).
6. Insertar masivamente `FeedbackNotes` y `ReceivedFeedback` (usando proveedor `mock` si hay autogeneración).
7. Insertar masivamente `WorkJournalEntries`.
8. Insertar `Commitments`, `CommitmentItems` y `CommitmentOutcomes`.

## 4. Checklist de Tareas para el Agente Implementador

- [ ] Instalar `@faker-js/faker` como dependencia de desarrollo.
- [ ] Construir y exponer la función `createUseCases` (o similar) en los `.module.ts` actuales de ser necesario, para permitir que se creen los módulos E2E.
- [ ] Implementar `MockPdfTextExtractor` en `cv-library/infrastructure/services/`.
- [ ] Crear `src/modules/cv-library/cv-library.e2e.module.ts` inyectando el `MockPdfTextExtractor` y usando Storage y DocumentRepo reales.
- [ ] Crear carpetas `.test-infra/fixtures/cvs/` y añadir al menos 2 PDFs de prueba ligeros y válidos.
- [ ] Construir los archivos `*.fixture.ts` en `test-helpers/` para cada entidad relevante (Input generators basados en VOs y Faker).
- [ ] Crear el script principal del seeder.
- [ ] Replicar la lógica de "Clean up" inicial que borra registros previos del usuario usando el cliente Admin de supabase para evitar duplicados en reinicios (opcional, útil para idempotencia).
- [ ] Implementar el bucle de inserción masivo en el script de seed, manejando inyección de sesión con `signInWithPassword()` y llamadas a Casos de Uso.
- [ ] Asegurarse de invocar servicios de IA con `{ provider: 'mock' }`.
- [ ] Actualizar el comando de npm (ej. `supabase:seed-agent`) en `package.json` para ejecutar el nuevo script.

## 5. Ejemplo de un Fixture (Referencia)

```typescript
// src/modules/feedback-notes/test-helpers/feedback.fixture.ts
import { faker } from "@faker-js/faker";
import { FeedbackStatus } from "../domain/value-objects/feedback-status.value-object";
import type { CreateFeedbackInput } from "../application/use-cases/create-feedback.use-case";

export class FeedbackFixture {
  static createInput(overrides: Partial<CreateFeedbackInput> = {}): CreateFeedbackInput {
    return {
      personName: faker.person.fullName(),
      status: faker.helpers.arrayElement(["active", "closed"] as const), // Valido según dominio
      ...overrides,
    };
  }
}
```

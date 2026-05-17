# Plan de Ampliación de Cobertura E2E

Este documento detalla los flujos adicionales a cubrir mediante pruebas E2E utilizando Playwright, basándonos en la arquitectura actual y los módulos funcionales de la aplicación. Servirá como hoja de ruta y registro de estado (status) durante la implementación.

## User Review Required

> [!IMPORTANT]
> Por favor, revisa las prioridades de los módulos a testear. Si prefieres empezar por algún módulo en particular (por ejemplo, `Job Match` en lugar de `Work Journal`), indícalo para ajustar el orden de ejecución.

## Open Questions

> [!NOTE]
> Para el flujo de Gemini (IA), ¿prefieres que mockeemos las respuestas de red a nivel de Playwright (`page.route`) para simular la IA sin consumir tokens reales, o prefieres probar únicamente la UI hasta el punto previo a la llamada a la IA?

## Flujos a Implementar y Estado (Status)

Se utilizará la siguiente nomenclatura para el seguimiento:
- `[ ]` Tarea no iniciada
- `[/]` Tarea en progreso
- `[x]` Tarea completada

### 1. Diario de Trabajo (Work Journal) - Prioridad Alta
Este es el módulo de referencia para la arquitectura hexagonal.
- `[x]` **Crear archivo:** `e2e/work-journal.spec.ts`
- `[x]` Test: Navegar a la sección del diario.
- `[x]` Test: Crear una nueva entrada en el diario.
- `[x]` Test: Editar una entrada existente.
- `[x]` Test: Borrar una entrada y verificar que desaparece de la lista.

### 2. Ajuste a Oferta (Job Match) - Prioridad Alta
Flujo core para la búsqueda de empleo.
- `[ ]` **Crear archivo:** `e2e/job-match.spec.ts`
- `[ ]` Test: Seleccionar un CV existente.
- `[ ]` Test: Rellenar formulario con descripción de una oferta de trabajo.
- `[ ]` Test: Iniciar análisis de ajuste (mockeando la respuesta de la IA).
- `[ ]` Test: Verificar que se muestran los resultados (fit, recomendaciones).

### 3. Configuración y Perfil (Settings) - Prioridad Alta
Requisito previo para el uso real de la IA.
- `[ ]` **Crear archivo:** `e2e/settings.spec.ts`
- `[ ]` Test: Navegar a la configuración de usuario.
- `[ ]` Test: Configurar y guardar una API Key de Gemini simulada.
- `[ ]` Test: Verificar la persistencia tras recargar.

### 4. Notas de Feedback (Received Feedback) - Prioridad Media
- `[ ]` **Crear archivo:** `e2e/received-feedback.spec.ts`
- `[ ]` Test: Navegar a la sección de Feedback Recibido.
- `[ ]` Test: Añadir una nota de feedback manual.
- `[ ]` Test: Editar la nota guardada.
- `[ ]` Test: Borrar la nota.

### 5. Gestión de Compromisos (Commitments) - Prioridad Media
- `[ ]` **Crear archivo:** `e2e/commitments.spec.ts`
- `[ ]` Test: Navegar a los objetivos/compromisos.
- `[ ]` Test: Crear un nuevo compromiso.
- `[ ]` Test: Marcar un compromiso como completado (cambio de estado).
- `[ ]` Test: Eliminar el compromiso.

### 6. Mock de Flujo de IA Completo - Opcional / Refinamiento
- `[ ]` **Añadir a:** `e2e/core-cv-analysis.spec.ts` o crear uno específico.
- `[ ]` Test: Interceptar llamada a backend (`/api/...`) en Playwright.
- `[ ]` Test: Devolver payload simulado de éxito de Gemini.
- `[ ]` Test: Validar renderizado de UI (Scores, Pros, Contras) sin usar la API real.

## Verification Plan

- Por cada módulo implementado, se ejecutará el comando local de e2e `npm run e2e:local` apuntando al test específico para asegurar que pasa.
- Se asegurará que no hay efectos secundarios con el aislamiento de usuarios (`ownership.spec.ts`), utilizando helpers como `createConfirmedUser` para cada caso de prueba.

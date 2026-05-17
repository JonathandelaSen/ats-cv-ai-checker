# Plan: Screaming Architecture — Frontend

## Estado actual

Los componentes frontend ya están reorganizados en carpetas que reflejan los módulos backend (screaming architecture). Los cambios están **sin commit** en `main`.

### Estructura resultante

```
src/components/
  auth/                        ← Login, registro, reset password
    auth-form.tsx
    auth-hero-title.tsx
    update-password-form.tsx

  shell/                       ← Layout principal de la app
    app-shell.tsx              ← Orquestador de vistas, tabs, detalle
    sidebar.tsx                ← Navegación lateral + lista de análisis

  settings/                    ← Configuración del usuario
    settings-view.tsx

  cv-analysis/                 ← Análisis de CVs (espejo de modules/cv-analysis)
    analysis-view.tsx          ← Vista detalle con tabs (resumen, oferta, etc.)
    score-hero.tsx             ← Cabecera con puntuación circular
    tab-resumen.tsx
    tab-oferta.tsx
    tab-entrevista.tsx
    tab-chat-oferta.tsx
    tab-seguimiento.tsx
    extraction-view.tsx        ← Vista de extracción de texto del PDF
    analysis-mode-selector.tsx ← Selector general vs job_match
    general-analysis-form.tsx  ← Formulario de análisis general
    job-match-form.tsx         ← Formulario de análisis job match
    cv-analyses-list-view.tsx  ← Lista de análisis de CV
    ai-analysis-view.tsx       ← (legacy, pendiente de eliminar o integrar)

  job-match-analysis/          ← Análisis de ofertas (espejo de modules/job-match-analysis)
    job-analyses-list-view.tsx

  cv-library/                  ← Biblioteca de CVs (espejo de modules/cv-library)
    cv-library.tsx             ← Lista de CVs del usuario
    cv-editor-view.tsx         ← Editor de CV con preview
    cv-template-preview.tsx    ← Preview de plantillas
    templates-view.tsx         ← Galería de plantillas
    new-analysis-flow.tsx      ← Flujo de subida + análisis nuevo
    upload-phase.tsx           ← Fase de subida de PDF
    cv-manual-editor/          ← Editor manual de secciones del CV
      manual-editor.tsx
      section-basics.tsx
      section-summary.tsx
      section-experience.tsx
      section-education.tsx
      section-skills.tsx
      section-languages.tsx
      section-named-items.tsx
      array-section-wrapper.tsx
      editable-bullet-list.tsx
      use-profile-history.ts

  selection-process/           ← Proceso de selección (espejo de modules/selection-process)
    interview-questions-view.tsx

  work-journal/                ← Diario de trabajo (espejo de modules/work-journal)
    work-journal-view.tsx

  feedback-notes/              ← Notas de feedback (espejo de modules/feedback-notes)
    feedback-notes-view.tsx

  received-feedback/           ← Feedback recibido (espejo de modules/received-feedback)
    received-feedback-view.tsx

  commitments/                 ← Objetivos (espejo de modules/commitments)
    objectives-view.tsx

  observability/               ← Dashboard de admin (espejo de modules/shared/observability)
    admin-observability-dashboard.tsx

  shared/                      ← Componentes compartidos cross-feature
    i18n-provider.tsx          ← Provider de internacionalización
    interface-language-select.tsx ← Selector de idioma
    pdf-preview.tsx            ← Visor de PDF embebido
    copy-prompt-modal.tsx      ← Modal para copiar prompts de IA
    skeletons/                 ← Skeleton loaders por feature
      index.ts
      analysis-detail-skeleton.tsx
      cv-analyses-list-skeleton.tsx
      job-analyses-list-skeleton.tsx
      feedback-notes-skeleton.tsx
      objectives-skeleton.tsx
      observability-skeleton.tsx
      received-feedback-skeleton.tsx
      work-journal-skeleton.tsx

  ui/                          ← Primitivos shadcn/ui (no tocar)
    skeleton.tsx
    tabs.tsx
    button.tsx
    ...
```

## Lo que ya está hecho

1. **Movimiento de archivos**: Todos los componentes movidos a sus carpetas de módulo.
2. **Actualización de imports**: Todos los `@/components/...` actualizados en `src/app/`, `src/components/`, y cualquier otro archivo que los importara.
3. **Skeleton loaders extraídos**: Los 11 skeletons inline se extrajeron a `shared/skeletons/` con barrel export.
4. **Skeleton loaders nuevos**: Se añadieron skeletons para Work Journal, Received Feedback, Admin Observability y Analysis Detail (que antes solo tenían spinner o nada).
5. **Build verificado**: `npm run build` pasa sin errores.
6. **DDD checks verificados**: `npm run ddd:check` pasa sin errores.

## Próximos pasos sugeridos

### Prioridad alta

- [ ] **Revisar y hacer commit** de los cambios actuales. Son puramente de organización — no hay cambios de lógica ni de UI.
- [ ] **Mover `AnalysisSummary` type fuera de `sidebar.tsx`**. Actualmente `cv-analyses-list-view` y `job-analyses-list-view` importan este tipo desde `@/components/shell/sidebar`, lo cual rompe la dirección de dependencias (feature → shell). Debería ir a `shared/` o a un archivo de tipos compartidos.

### Prioridad media

- [ ] **Limpiar `ai-analysis-view.tsx`** en `cv-analysis/`. Parece un archivo legacy. Verificar si se usa o si fue reemplazado por `analysis-view.tsx`.
- [ ] **Añadir barrel exports (`index.ts`)** a cada carpeta de módulo frontend para que los imports sean más limpios: `from "@/components/cv-analysis"` en vez de `from "@/components/cv-analysis/analysis-view"`.
- [ ] **Mover skeletons a sus módulos**: Opcionalmente, cada skeleton podría vivir dentro de su carpeta de módulo en vez de en `shared/skeletons/`. Por ejemplo, `cv-analysis/cv-analyses-list-skeleton.tsx`. Esto es más purista pero menos práctico si se importan desde el shell.

### Prioridad baja

- [ ] **Renombrar archivos genéricos** dentro de cada carpeta. Ahora que `feedback-notes-view.tsx` vive dentro de `feedback-notes/`, el sufijo `-view` es redundante. Podría simplificarse a `feedback-notes/index.tsx` o `feedback-notes/feedback-notes.tsx`. Aplicar la misma lógica a `work-journal-view.tsx`, `objectives-view.tsx`, etc.
- [ ] **Documentar la convención** en CLAUDE.md para que futuros componentes se creen directamente en la carpeta del módulo correspondiente.
- [ ] **Considerar `cv-analysis/` y `job-match-analysis/` compartiendo componentes**: `job-analyses-list-view` es muy similar a `cv-analyses-list-view`. Si divergen poco, podrían compartir un componente base en `shared/`.

## Convención para nuevos componentes

Cuando se cree un nuevo componente:

1. Identificar a qué módulo backend pertenece la funcionalidad.
2. Crear el archivo dentro de `src/components/<nombre-modulo>/`.
3. Si es un componente reutilizable sin pertenencia a un módulo → `src/components/shared/`.
4. Si es un primitivo UI genérico → `src/components/ui/` (preferir shadcn).
5. Los skeletons van en `src/components/shared/skeletons/` y se exportan desde el barrel.

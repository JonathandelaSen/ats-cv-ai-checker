# UI Internationalization Guide

This guide defines how to continue UI internationalization after the first infrastructure phase.

## Scope

Internationalization in this document covers only the app UI: navigation, forms, settings, empty states, validation messages, toasts, modal text, labels, and page metadata.

It does not cover professional content language. CV templates, generated PDFs, AI prompts, AI outputs, analyses, and user-authored CV content keep their own language rules and must not be coupled to the UI language.

## Product Language

Use the terms from `CONTEXT.md`:

- **Interface Language**: the language used to navigate the app UI.
- **Interface Language Preference**: the signed-in user's saved Interface Language.
- **Visitor Interface Language Choice**: the temporary choice before sign-in.
- **Browser Language**: the browser-reported language used only before an explicit choice exists.
- **Professional Content Language**: language of CVs, PDFs, analyses, and AI outputs.

Do not use "locale" ambiguously in product-facing docs or UI. If code uses `locale`, clarify whether it represents Interface Language or Professional Content Language.

## Supported Languages

The only supported Interface Languages are:

- English (`en`)
- Spanish (`es`)

Language resolution order:

1. Signed-in user's Interface Language Preference.
2. Visitor Interface Language Choice.
3. Supported Browser Language.
4. English.

Do not implement URL-based language routing. Routes must stay language-neutral.

## First Phase Target

The first implementation phase should establish the pattern and cover critical UI:

- i18n infrastructure and message loading.
- Root layout `lang` value driven by resolved Interface Language.
- Login, password recovery, and password update screens.
- App shell, sidebar, navigation, global actions, and common empty/loading/error states.
- Settings language selector.
- Persistence for authenticated users.
- Local visitor choice for unauthenticated users.
- A documented convention for adding translation keys.

Avoid trying to translate every large feature screen in the same first phase if it forces broad unrelated rewrites.

## Continuation Workflow For Agents

When migrating a new surface:

1. Identify all user-visible strings in the target component, route, and nearby helper components.
2. Move strings into the translation messages for both `en` and `es`.
3. Use stable semantic keys, not copies of the English text.
4. Keep translation namespaces aligned with product areas, for example `auth`, `settings`, `navigation`, `cvLibrary`, `analysis`, `workJournal`.
5. Preserve Professional Content Language behavior. Do not derive CV, PDF, AI, or analysis output language from Interface Language.
6. If a backend-facing action is edited and has platform interaction, keep observability coverage aligned with the repository instructions.
7. Add or update tests where the migrated code has branching language behavior.
8. Run the required verification commands for the touched area.

## Translation Key Conventions

Use clear namespaces:

```text
auth.login.title
auth.login.submit
settings.language.label
settings.language.options.en
settings.language.options.es
navigation.cvLibrary
common.actions.save
common.states.loading
```

Prefer:

- `common.actions.save`
- `analysis.score.emptyState.title`
- `workJournal.entryForm.topicLabel`

Avoid:

- `saveButtonText`
- `text1`
- `span_42`
- Keys copied from full prose sentences.

## Component Rules

Do not leave hardcoded user-visible UI text in migrated components.

Acceptable hardcoded strings:

- Technical constants.
- API field names.
- CSS class names.
- Internal enum values.
- Professional content produced by users, AI services, CV templates, or stored records.

Questionable cases must be classified before editing. If a string is visible to the user as app chrome, translate it. If it is content being edited, generated, exported, or analyzed, keep it under Professional Content Language rules.

## Settings Behavior

The settings screen must expose an Interface Language selector with only English and Spanish.

Expected behavior:

- Changing language updates the UI.
- Signed-in users persist the choice as Interface Language Preference.
- Visitors persist the choice locally as Visitor Interface Language Choice.
- Existing signed-in preference wins over visitor choice.
- If a signed-in user has no preference, a visitor choice may initialize the user's preference.

## Public And Auth Screens

Public and auth screens must support both languages because users need to understand the UI before signing in.

This includes:

- Login.
- Password recovery.
- Password update.
- Auth errors and success states.
- Public CV page app chrome, if any.

Do not translate the public CV content itself based on Interface Language.

## Verification Checklist

Before finishing an i18n migration step:

- `rg` the touched files for remaining hardcoded visible Spanish or English UI strings.
- Verify both English and Spanish render without missing keys.
- Check login/auth flows if auth text changed.
- Check settings language switching.
- Run `npm run build` after changes under `src/app`, `src/components`, `src/lib`, or `src/modules`.
- Run `npm run ddd:check` if changes touch `src/modules`.

## Non-Goals

Do not introduce:

- URL language prefixes such as `/en` or `/es`.
- Automatic translation of user content.
- Interface Language-driven AI output language.
- Interface Language-driven CV/PDF template language.
- More than English and Spanish before the two-language implementation is stable.

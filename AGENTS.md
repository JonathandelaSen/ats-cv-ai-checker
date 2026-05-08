## Supabase local auth email templates

When changing `supabase/config.toml` auth email template settings or any file in `supabase/templates/`, restart the local Supabase stack before asking the user to test. Use `npm run supabase:stop` followed by `npm run supabase:start`, then mention the local Mailpit URL from `supabase status`.

## Supabase production migrations

Never apply migrations or schema changes to the production Supabase project. Prepare and verify migration files locally, but leave production application to the user unless they explicitly instruct otherwise in the same turn.

## AI prompts and model controllers

Keep prompts and model-call logic/controllers in separate files. La lógica/controladores que llaman a modelos debe mantenerse en archivos separados de los prompts. Prompt builders/system instructions belong in prompt-only modules, and files that instantiate SDK clients or call model APIs must import those prompts instead of defining them inline. This reduces the risk that prompt edits break API integration code.

## AI prompt documentation

Every AI prompt family must have documentation under `docs/prompts/<prompt-type>/prompt.md`. The document must include the current prompt, the source file link/path, how it is fed with data, the runtime flow, and maintenance notes. When changing a prompt, prompt builder, model input data, response shape, or controller behavior that affects a prompt, actualizar la documentación del prompt en el mismo cambio.

## Git main branch

Never push to `main`. Commit locally or push to a non-main branch if requested, but leave `main` pushes to the user unless they explicitly instruct otherwise in the same turn.

## Worktrees

Work directly on `main` (the primary checkout) by default. Do not create git worktrees or switch to alternate branches unless the user explicitly asks for it in the same turn. If worktrees were created in earlier turns, clean them up and continue on `main`.

Do not add [extensions] worktreeConfig = true" to .git/config because it breaks antigravity IDE

## shadcn/ui

Utilizaremos shadcn/ui cuando exista algún componente en la librería que sea de utilidad. No reinventaremos la rueda y preferiremos los componentes existentes de shadcn antes que crear componentes UI personalizados desde cero.

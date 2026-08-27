# Git Workflow Rules

**Scope:** Branching, commits, and PRs for this repo. **Consult when** committing, opening a PR, or managing migrations.
**Authority:** repo conventions; [TASKS](../../docs/TASKS.md); [ADR-0001](../../docs/adr/0001-stack.md).

## Branching

- **Never commit directly to `main`.** Work on short-lived branches named for the epic/task, e.g. `e1-foundation`, `e1-t2-database`, `e2-creation-form`.
- Rebase/merge onto the latest `main` before opening a PR. Interactive rebase (`-i`) is unavailable in the agent environment — avoid workflows that require it.
- Only commit or push when the user asks. Do not push work the user hasn't approved.

## Commits

- **Conventional Commits**, enforced by the `commit-msg` hook. Subject: `<type>(optional-scope): <description>`, imperative, ≤72 chars. Allowed types: `feat fix docs chore test refactor perf ci build style revert` (e.g. `feat(api): …`, `fix(web): …`, `chore(ci): …`).
- **No AI attribution (enforced by the `commit-msg` hook).** Commit messages MUST NOT contain `Co-authored-by:` trailers naming AI agents (Claude, Codex, Cursor, Copilot, ChatGPT/OpenAI, Gemini, etc.) or AI generation signatures like "🤖 Generated with Claude Code". **Real human co-authors are allowed.** The same applies to PR descriptions — do not add AI-assistant credit lines.
- Small, atomic commits — one logical change each. The `pre-commit` hook runs `lint-staged` (Prettier); before pushing, ensure `pnpm typecheck && pnpm lint && pnpm test` (and `pnpm build` for app changes) pass.
- Never commit secrets. `.env*` is gitignored; only `.env.example` is tracked. Don't commit build output (`dist/`, `.next/`, `coverage/`) or `next-env.d.ts`.

## Pull requests

- Open PRs with the `gh` CLI. A PR MUST pass CI (**typecheck + lint + test + build**) before merge.
- PR description references the epic/task (e.g. `E1.T2`) and the PRD requirement it satisfies (e.g. `P0.3`), and links any relevant ADR. Update the matching `docs/TASKS.md` checkboxes in the same PR. Do not add AI-assistant credit lines to the PR body (see the no-AI-attribution rule above).
- Prefer squash-merge to keep `main` history clean. Use `/code-review` (or ultrareview) before merging non-trivial changes.

## Database migrations (ties to E1.T2)

- **Never edit a migration that has been applied/committed.** To change the schema, add a new migration. Commit the migration and the `schema.prisma` change together.
- Migrations must apply cleanly empty→head; verify locally before pushing.
